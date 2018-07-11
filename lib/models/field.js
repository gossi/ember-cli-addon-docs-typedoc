'use strict';

const Entity = require('./-entity');
const { ReflectionKind } = require('typedoc');

// interface Field {
//   name: string;
//   type: string;
//   file: string;
//   description: string;
//   lineNumber: number;
//   access: string;
//
//   isStatic: boolean;
//   isRequired: boolean;
//   isImmutable: boolean;
//   isReadOnly: boolean;
//
//   tags: Array<Tag>;
//   decorators: Array<Decorator>;
// }

module.exports = class Field extends Entity {
  static detect(ref) {
    return ref.kind & ReflectionKind.Property;
  }

  constructor(parent, ref, options) {
    super(parent, ref, options);

    this.name = ref.name;
    this.type = ref.type.toString();

    this.isStatic = ref.flags.isStatic;
    this.isRequired = !ref.defaultValue;

    // gossi: see comment below; btw: this sucks here ;)
    parent.addField(this);
  }

  // gossi: this will attach an empty field to the parent, thus a component cannot identify what kind of field that is and not assign as an argument
  // must be run after all properties for this field are set (at the end of the constructor)
  attachToParent(/*parent*/) {}
}
