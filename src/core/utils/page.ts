import { ApiProperty } from '@nestjs/swagger';

export class PageParam {
  page: number;
  size: number;

  constructor(
    opts: {
      page: number;
      size: number;
    },

    {
      maxPageSize = 20,
      minPageSize = 0,
    }: { maxPageSize?: number; minPageSize?: number } = {},
  ) {
    this.page = Math.max(1, opts.page);
    this.size = Math.max(Math.min(opts.size, maxPageSize), minPageSize);
  }

  get offset(): number {
    return (this.page - 1) * this.size;
  }
  get limit(): number {
    return this.size;
  }

  get skip(): number {
    return this.offset;
  }

  get take(): number {
    return this.limit;
  }
}

export class PageResult<T> {
  @ApiProperty()
  page: number;
  @ApiProperty()
  pageSize: number;
  @ApiProperty()
  data: T[];
  @ApiProperty()
  total: number;

  static empty<T>(): PageResult<T> {
    return { page: 0, pageSize: 0, data: [], total: 0 };
  }

  static from<T>(page: PageParam, data: T[], total: number): PageResult<T> {
    return { page: page.page, pageSize: page.size, data, total };
  }
}
