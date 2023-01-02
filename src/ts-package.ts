import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';
import { 
  GemeenteNijmegenOptions, 
  setDefaultValues, 
  setDefaultValuesNpmPublish, 
  setupSharedConfiguration 
} from './shared';

export interface GemeenteNijmegenTsPackageOptions extends
  TypeScriptProjectOptions, GemeenteNijmegenOptions {}

export class GemeenteNijmegenTsPackage extends TypeScriptProject {

  constructor(options: GemeenteNijmegenTsPackageOptions) {

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