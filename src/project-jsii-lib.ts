import { JsiiProject, JsiiProjectOptions } from 'projen/lib/cdk';
import { GemeenteNijmegenOptions, setDefaultValues, setDefaultValuesNpmPublish, setupSharedConfiguration } from './shared';

export interface GemeenteNijmegenJsiiOptions extends
  JsiiProjectOptions, GemeenteNijmegenOptions {}

/**
 * A GemeenteNijmegen projen project type for Jsii projects
 * bundled and published as an NPM package.
 *
 * @pjid jsii-lib
 */
export class GemeenteNijmegenJsii extends JsiiProject {

  private readonly options: GemeenteNijmegenJsiiOptions;

  constructor(options: GemeenteNijmegenJsiiOptions) {

    options = setDefaultValues(options);
    options = setDefaultValuesNpmPublish(options);

    /**
     * Construct the actual projen project
     */
    super(options);

    /**
     * Setup all shared configuration for this project e.g.
     * validate-repository workflow, auto-merge dependencies,
     * emergency workflow.
     */
    setupSharedConfiguration(this, options);

    this.options = options;
  }

  public configuredOptions() {
    return this.options;
  }

}