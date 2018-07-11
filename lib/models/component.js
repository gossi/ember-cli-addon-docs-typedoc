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
      // walk up parent chain to see, if ref is a descendent of a component
      do {
        let type = ref.typeHierarchy.types[0];
        if (type && type.name === 'Component') {
          return true;
        }
        ref = ref.parent;
      } while (ref && super.detect(ref));

      return false;
    }
  }

  constructor(parent, ref, options) {
    super(parent, ref, options);

    this.arguments = [];

    // gossi: cannot call this.extractArguments() here, since this.fields will ever be empty at this point. This will populated after the constructor is run.
    // this.extractArguments();
    this.extractYields();
  }

  attachToParent(parent) {
    parent.components.push(this);
  }

  addField(field) {
    if (
      field.tags.find(tag => tag.name === 'argument') ||
      field.decorators.find(decorator => decorator.name === 'argument')
    ) {
      this.arguments.push(field);
    } else {
      this.fields.push(field);
    }
  }

  // extractArguments() {
  //   let fields = [];
  //   let args = [];
  //   console.log('extract args', this.name, this.fields);

  //   for (let field of this.fields) {
  //     console.log('field', field.name, field.tags.find(tag => tag.name === 'argument'));
  //     if (
  //       field.tags.find(tag => tag.name === 'argument') ||
  //       field.decorators.find(decorator => decorator.name === 'argument')
  //     ) {
  //       args.push(field);
  //     } else {
  //       fields.push(field);
  //     }
  //   }
  //   this.fields = fields;
  //   this.arguments = args;
  // }

  extractYields() {
    let tags = [];
    let yields = [];
    for (let tag of this.tags) {
      if (tag.name === 'yield') {
        // gossi: this regex parses @yield similarly to how esdoc parses @param (and @yield) in the same manner
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
