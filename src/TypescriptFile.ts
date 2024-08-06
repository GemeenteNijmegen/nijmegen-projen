import { IConstruct } from 'constructs';
import { FileBase, IResolver } from 'projen';

export class TypescriptFile extends FileBase {

  private readonly contents: string;

  /**
   * Defines a text file.
   *
   * @param project The project
   * @param filePath File path
   * @param options Options
   */
  constructor(
    scope: IConstruct,
    filePath: string,
    contents: string,
  ) {
    super(scope, filePath);
    this.contents = contents;
  }

  protected synthesizeContent(_: IResolver): string | undefined {
    return this.contents;
  }
}