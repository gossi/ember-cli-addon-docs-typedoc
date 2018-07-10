'use strict';

const fs = require('fs-extra');
const path = require('path');
const Plugin = require('broccoli-plugin');
const { Application } = require('typedoc');
const { Context, Converter } = require('typedoc/dist/lib/converter');
const loadFromReflection = require('./load-from-reflection');
const Serializer = require('./serializer');
const resolve = require('resolve');
const ts = require('typescript');

module.exports = class DocsGenerator extends Plugin {
  constructor(inputTree, options) {
    super([inputTree]);

    this.project = options.project;
    this.compiler = options.compiler;
    this.destDir = options.destDir;
    this.app = new Application();

    this._verifyTSVersion();
  }

  build() {
    let converter = this.app.converter;
    // let program = this.compiler.getProgram().getProgram();
    // let checker = program.getTypeChecker();
    // let includeFiles = program.getSourceFiles()
    //   .map(source => path.resolve(source.fileName))
    //   .filter(file => file.startsWith(this.project.root) && !/\bnode_modules\b/.test(file));

    let includeFiles = this._readInput(this.inputPaths[0]);

    let program = ts.createProgram(includeFiles, this.app.options.getCompilerOptions(), converter.compilerHost);
    let context = new Context(converter, includeFiles, program.getTypeChecker(), program);

    converter.trigger(Converter.EVENT_BEGIN, context);
    converter.compile(context);
    converter.resolve(context);
    converter.trigger(Converter.EVENT_END, context);

    let docs = loadFromReflection(context, this.project);
    let json = Serializer.serialize('module', docs.modules);

    let outFile = path.join(this.outputPath, this.destDir, 'index.json');
    fs.ensureDirSync(path.dirname(outFile));
    fs.writeJsonSync(outFile, json, { spaces: 2 });
  }

  _readInput(p) {
    let contents = [];
    let files = fs.readdirSync(p);
    for (let file of files) {
      file = path.resolve(path.join(p, file));
      contents.push(file);
      let stat = fs.statSync(file);
      if (stat.isDirectory()) {
        for (let child of this._readInput(file)) {
          contents.push(child);
        }
      }
    }
    return contents;
  }

  _verifyTSVersion() {
    let typedocLocation = path.dirname(require.resolve('typedoc/package.json'));
    let typedocVersion = require(resolve.sync('typescript/package.json', { basedir: typedocLocation })).version;
    let projectVersion = this.project.require('typescript/package.json').version;
    let resolutionURL = 'https://yarnpkg.com/lang/en/docs/selective-version-resolutions';

    if (typedocVersion !== projectVersion) {
      this.project.ui.writeWarnLine(
        `Your project is using typescript@${projectVersion}, but TypeDoc is loading ` +
        `typescript@${typedocVersion}. This may lead to unexpected or missing documentation. ` +
        `You may want to try setting a version resolution in your package.json to ensure ` +
        `TypeDoc uses the same version as your project. See ${resolutionURL} for details.`
      );
    }
  }
}
