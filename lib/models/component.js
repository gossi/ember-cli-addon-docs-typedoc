'use strict';

const Class = require('./class');

// interface Component extends Class {
//   arguments: Array<Argument>;
//   yields: Array<Yield>;
// }
//
// interface Argument extends Field {}
//
// interface Yield {
//   name: string;
//   type: string;
//   description: string;
// }


module.exports = class Component extends Class {
  static detect(ref) {
    if (super.detect(ref)) {
      let type = ref.typeHierarchy.types[0];
      return type && type.name === 'Component';
    }
  }

  constructor(parent, ref, options) {
    super(parent, ref, options);

    this.extractArguments();
    this.extractYields();
  }

  attachToParent(parent) {
    parent.components.push(this);
  }

  extractArguments() {
    let fields = [];
    let args = [];
    for (let field of this.fields) {
      if (
        field.tags.find(tag => tag.name === 'argument') ||
        field.decorators.find(decorator => decorator.name === 'argument')
      ) {
        args.push(field);
      } else {
        fields.push(field);
      }
    }
    this.fields = fields;
    this.arguments = args;
  }

  extractYields() {
    let tags = [];
    let yields = [];
    for (let tag of this.tags) {
      if (tag.name === 'yield') {
        let [, type, name, description] = /^(\{.*?\})?\s*([^\s]*)?\s*-?\s*(.*)/.exec(tag.value);
        yields.push({ name, type, description });
      } else {
        tags.push(tag);
      }
    }
    this.tags = tags;
    this.yields = yields;
  }
}
