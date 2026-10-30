// opentype.js 1.3.4 ships no types; this covers only the members cards.ts uses.
declare module "opentype.js" {
  namespace opentype {
    interface Glyph {
      index: number;
    }
    interface Font {
      charToGlyph(char: string): Glyph;
      getAdvanceWidth(text: string, fontSize?: number, options?: object): number;
    }
    function parse(buffer: ArrayBuffer, opt?: object): Font;
  }
  export default opentype;
}
