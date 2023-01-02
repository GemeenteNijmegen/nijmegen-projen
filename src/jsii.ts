import { JsiiProject, JsiiProjectOptions } from 'projen/lib/cdk';
import { GemeenteNijmegenOptions, setDefaultValues, setDefaultValuesNpmPublish, setupSharedConfiguration } from './shared';

export interface GemeenteNijmegenJsiiOptions extends
  JsiiProjectOptions, GemeenteNijmegenOptions {}

export class GemeenteNijmegenJsii extends JsiiProject {

  constructor(options: GemeenteNijmegenJsiiOptions) {

    setDefaultValues(options, options); // Well this looks wierd...
    setDefaultValuesNpmPublish(options, options);

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

  }

}