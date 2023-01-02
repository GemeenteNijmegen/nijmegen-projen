import { AwsCdkConstructLibrary, AwsCdkConstructLibraryOptions } from 'projen/lib/awscdk';
import { GemeenteNijmegenOptions, setDefaultValues, setDefaultValuesNpmPublish, setupSharedConfiguration } from './shared';

export interface GemeenteNijmegenCdkLibOptions extends
  AwsCdkConstructLibraryOptions, GemeenteNijmegenOptions {}

export class GemeenteNijmegenCdkLib extends AwsCdkConstructLibrary {

  constructor(options: GemeenteNijmegenCdkLibOptions) {

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