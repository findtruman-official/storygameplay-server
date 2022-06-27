class ErrCodeGenerator {
  public readonly codes: { code: number; desc: string }[] = [];

  constructor(
    public readonly start: number,
    public readonly lessThan: number,
  ) {}

  define<T = any>(code: number, desc: string): (data?: T) => ServiceException {
    if (code >= this.lessThan || code < this.start) {
      throw new Error(
        `code should included in [${this.start}, ${this.lessThan}), now is ${code}`,
      );
    }

    for (const existedCode of this.codes) {
      if (existedCode.code === code) {
        throw new Error(
          `internal code ${code} confilt with '${existedCode.desc}'`,
        );
      }
    }

    this.codes.push({
      code: code,
      desc,
    });
    return (data?: T) => new ServiceException(code, desc, data);
  }
}

export default class ServiceException extends Error {
  static tables: {
    desc: string;
    generator: ErrCodeGenerator;
  }[] = [];

  constructor(
    readonly code: number,
    readonly msg: string,
    readonly data?: any,
  ) {
    super(`code=${code}; msg=${msg}`);
  }

  static register(
    desc: string,
    startCode: number,
    lessThan: number,
  ): ErrCodeGenerator {
    if (lessThan <= startCode) {
      throw new Error('lessThan should larger than startCode.');
    }
    for (const existedTable of this.tables) {
      if (
        startCode >= existedTable.generator.lessThan ||
        lessThan <= existedTable.generator.start
      ) {
        // pass
      } else {
        throw new Error(
          `code range [${startCode}, ${lessThan}) is conflicted with '${existedTable.desc}' [${existedTable.generator.start}, ${existedTable.generator.lessThan})`,
        );
      }
      if (existedTable.desc === desc) {
        throw new Error(`duplicated ErrCode '${desc}'`);
      }
    }
    const generator = new ErrCodeGenerator(startCode, lessThan);
    this.tables.push({
      desc,
      generator,
    });
    return generator;
  }
}
