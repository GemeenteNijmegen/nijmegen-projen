import { AwsCdkConstructLibrary, AwsCdkConstructLibraryOptions } from 'projen/lib/awscdk';
import { GemeenteNijmegenOptions, setDefaultValues, setDefaultValuesNpmPublish, setupSharedConfiguration } from './shared';

export interface GemeenteNijmegenCdkLibOptions extends
  AwsCdkConstructLibraryOptions, GemeenteNijmegenOptions {}

/**
 * A GemeenteNijmegen projen project type for AwsCdkConstructLibraries
 * bundled and published as an NPM package.
 *
 * @pjid cdk-lib
 */
export class GemeenteNijmegenCdkLib extends AwsCdkConstructLibrary {

  constructor(options: GemeenteNijmegenCdkLibOptions) {

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

  }

}