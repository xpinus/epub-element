import { getObjectType, extend, isNumber, isCFIString } from '../utils';

/**
	* Parsing and creation of EpubCFIs: http://www.idpf.org/epub/linking/cfi/epub-cfi.html

	* Implements: 实现
	* - Character Offset: epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)
	* - Simple Ranges : epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)

	* Does Not Implement: 没有实现的部分
	* - Temporal Offset (~)
	* - Spatial Offset (@)
	* - Temporal-Spatial Offset (~ + @)
	* - Text Location Assertion ([)
*/

type CFIFrom = string | Range | Node | EpubCFI;

// class to ignore when parsing DOM
// type IgnoreClass = string;

type CFI_Terminal = {
  offset: number | null;
  assertion: string | null;
};

type CFI_Step = {
  type: 'element' | 'text';
  index: number;
  id?: string | undefined;
};

type CFI_Block = {
  steps: CFI_Step[];
  terminal?: CFI_Terminal;
};

class EpubCFI {
  str: string;

  spineIndex: number;
  base: null | CFI_Block;
  path: null | CFI_Block;
  range: boolean;
  start: null | CFI_Block;
  end: null | CFI_Block;

  constructor(cfiFrom: CFIFrom, base?: string) {
    this.str = '';
    this.base = null;
    this.spineIndex = -1;
    this.range = false;
    this.path = null;
    this.start = null;
    this.end = null;

    const type = this.checkType(cfiFrom);

    switch (type) {
      case 'string':
        this.str = cfiFrom as string;
        return extend(this, this.parse(this.str));
      case 'range':
        break;
      case 'node':
        if (!base) {
          throw new TypeError('base path is required for node');
        }
        this.base = this.parseCFIBlock(base);
        return extend(this, this.fromNode(cfiFrom as Node, this.base));
      default:
        throw new TypeError('not a valid argument for EpubCFI');
    }

    console.log(this.toString());
  }

  /**
   * @description Check the type of constructor input
   */
  checkType(cfi: CFIFrom) {
    if (isCFIString(cfi)) {
      return 'string';
    } else if (
      cfi &&
      typeof cfi === 'object' &&
      (getObjectType(cfi) === 'Range' || typeof (cfi as Range).startContainer != 'undefined')
    ) {
      return 'range';
    } else if (cfi && typeof cfi === 'object' && typeof (cfi as Node).nodeType != 'undefined') {
      return 'node';
    } else if (cfi && typeof cfi === 'object' && cfi instanceof EpubCFI) {
      return 'EpubCFI';
    } else {
      return false;
    }
  }

  /**
   * @description Parse a cfi string to a CFI object representation
   */
  parse(cfiStr: string) {
    const cfi = {
      spineIndex: -1,
      range: false,
      base: {} as CFI_Block,
      path: {} as CFI_Block,
      start: null as CFI_Block | null,
      end: null as CFI_Block | null,
    };

    const [chapterCFI, contentCFI, rangeCFI] = this.splitCfiBlocks(cfiStr);

    if (!chapterCFI) {
      // 一个合法的CFI字符串至少必须包含指向spine的路径
      throw new Error('invalid cfi string, chapterPath is undefined');
    }

    cfi.base = this.parseCFIBlock(chapterCFI);
    cfi.spineIndex = cfi.base.steps[1].index;

    if (contentCFI) {
      console.log(contentCFI);
      cfi.path = this.parseCFIBlock(contentCFI);
    }

    if (rangeCFI) {
      cfi.range = true;
      cfi.start = this.parseCFIBlock(rangeCFI[0]);
      cfi.end = this.parseCFIBlock(rangeCFI[1]);
    }
    console.log(cfi);

    return cfi;
  }

  // 分割cfi字符串，代表不同的解析区域
  splitCfiBlocks(cfi: string): [string, string | null, [string, string] | null] {
    const cfiStr = cfi.slice(8, cfi.length - 1);
    let blocks = cfiStr.split('!');

    if (blocks.length < 1 || blocks.length > 2) {
      throw new Error('invalid cfi string: ' + cfiStr);
    }

    const chapterCfiBlock = blocks[0]; // 表示章节位置的cfi区块
    let contentCfiBlock: null | string = null;
    let rangeCfiBlock: null | [string, string] = null;

    if (blocks[1]) {
      // 表示内容位置的cfi区块
      blocks = blocks[1].split(',');
      contentCfiBlock = blocks[0];

      if (blocks.length === 3) {
        rangeCfiBlock = [blocks[1], blocks[2]];
      }
    }

    return [chapterCfiBlock, contentCfiBlock, rangeCfiBlock];
  }

  parseCFIBlock(componentStr: string) {
    const block = {
      steps: [],
      terminal: {
        offset: null,
        assertion: null,
      },
    } as CFI_Block;

    const parts = componentStr.split(':');
    const steps = parts[0].split('/');
    let terminal;

    if (parts.length > 1) {
      terminal = parts[1];
      block.terminal = this.parseTerminal(terminal);
    }

    if (steps[0] === '') {
      steps.shift(); // Ignore the first slash
    }

    block.steps = steps.map((step) => {
      return this.parseStep(step);
    });

    return block;
  }

  parseStep(stepStr: string) {
    let id;

    const has_brackets = stepStr.match(/\[(.*)\]/);
    if (has_brackets && has_brackets[1]) {
      id = has_brackets[1];
    }

    //-- Check if step is a text node or element
    const num = parseInt(stepStr);

    if (isNaN(num)) {
      throw new Error('invalid step: ' + stepStr);
    }

    let type = null,
      index = -1;
    if (num % 2 === 0) {
      // Even = is an element
      type = 'element';
      index = num / 2 - 1;
    } else {
      type = 'text';
      index = (num - 1) / 2;
    }

    return {
      type: type,
      index: index,
      id: id,
    } as CFI_Step;
  }

  parseTerminal(termialStr: string): CFI_Terminal {
    let characterOffset = null,
      textLocationAssertion = null;
    const assertion = termialStr.match(/\[(.*)\]/);

    if (assertion && assertion[1]) {
      characterOffset = parseInt(termialStr.split('[')[0]);
      textLocationAssertion = assertion[1];
    } else {
      characterOffset = parseInt(termialStr);
    }

    if (!isNumber(characterOffset)) {
      characterOffset = null;
    }

    return {
      offset: characterOffset,
      assertion: textLocationAssertion,
    };
  }

  /**
   * @description 从指定节点创建CFI
   */
  fromNode(anchor: Node, base: CFI_Block) {
    const cfi = {
      spineIndex: base.steps[1].index,
      base,
      path: {} as CFI_Block,
      range: false,
      start: null,
      end: null,
    };

    cfi.path = this.pathTo(anchor);

    return cfi;
  }

  /**
   * 获得到节点的path
   */
  pathTo(node: Node) {
    const segment = {
      steps: [],
      terminal: {
        offset: null,
        assertion: null,
      },
    } as CFI_Block;
    let currentNode = node;

    while (
      currentNode &&
      currentNode.nodeName.toLowerCase() !== 'epub-view-body' &&
      currentNode.parentNode &&
      currentNode.parentNode.nodeType !== Node.COMMENT_NODE
    ) {
      const step: any = {};

      if (currentNode.nodeType === Node.TEXT_NODE) {
        step.type = 'text';
        const siblings = Array.from(currentNode.parentNode.childNodes).filter((node: Node) => {
          return node.nodeType === Node.TEXT_NODE;
        });
        step.index = siblings.indexOf(currentNode as ChildNode);
      } else {
        step.type = 'element';
        const siblings = Array.from(currentNode.parentNode.childNodes).filter((node: Node) => {
          return node.nodeType === Node.ELEMENT_NODE;
        });
        step.index = siblings.indexOf(currentNode as ChildNode);

        step.id = (currentNode as HTMLElement).getAttribute('id');
      }

      segment.steps.unshift(step as CFI_Step);

      currentNode = currentNode.parentNode;
    }

    return segment;
  }

  /**
   * @description convert to EpubCFI to a epubcfi(...) string
   */
  toString() {
    if (!this.base || !this.path) {
      throw new Error('EpubCFI is not valid');
    }

    let cfiStr = 'epubcfi(';

    cfiStr += this.segmentString(this.base);
    cfiStr += '!';
    cfiStr += this.segmentString(this.path);

    // Add Range, if present
    if (this.range && this.start && this.end) {
      cfiStr += ',' + this.segmentString(this.start) + ',' + this.segmentString(this.end);
    }

    cfiStr += ')';

    return cfiStr;
  }

  segmentString(block: CFI_Block) {
    if (block.steps.length === 0) {
      return '';
    }

    let segmentString = '';

    segmentString = block.steps.reduce((pre: string, cur: CFI_Step) => {
      let segment = '';
      if (cur.type === 'element') {
        segment += (cur.index + 1) * 2;
      }

      if (cur.type === 'text') {
        segment += 1 + 2 * cur.index;
      }

      if (cur.id) {
        segment += '[' + cur.id + ']';
      }

      pre += '/' + segment;

      return pre;
    }, '');

    if (block.terminal && block.terminal.offset) {
      segmentString += ':' + block.terminal.offset;
    }

    if (block.terminal && block.terminal.assertion) {
      segmentString += '[' + block.terminal.assertion + ']';
    }

    return segmentString;
  }
}

export default EpubCFI;
