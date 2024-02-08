import { TypeScriptProject, TypeScriptProjectOptions } from 'projen/lib/typescript';
import {
  GemeenteNijmegenOptions,
  setDefaultValues,
  setDefaultValuesNpmPublish,
  setupSharedConfiguration,
} from './shared';

export interface GemeenteNijmegenTsPackageOptions extends
  TypeScriptProjectOptions, GemeenteNijmegenOptions {}

/**
 * A GemeenteNijmegen projen porject type for typescript projects
 * bundled and published as an NPM package.
 *
 * @pjid ts-lib
 */
export class GemeenteNijmegenTsPackage extends TypeScriptProject {

  private readonly options: GemeenteNijmegenTsPackageOptions;

  constructor(options: GemeenteNijmegenTsPackageOptions) {

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