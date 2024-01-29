

import { ColorInputParams } from 'tweakpane';
import { BindingReader, BindingTarget, BindingWriter, Color, ColorController, FloatColor, Formatter, InputBindingPlugin, IntColor, RgbColorObject, RgbaColorObject, colorToObjectRgbString, colorToObjectRgbaString, createColorStringParser, createPlugin, equalsColor, isColorObject, isRgbaColorObject } from '@tweakpane/core';
import { ColorComponents3, ColorComponents4, ColorType } from '@tweakpane/core/dist/input-binding/color/model/color-model';
import { mapColorType } from '@tweakpane/core/dist/input-binding/color/model/colors';
import { parseColorInputParams } from '@tweakpane/core/dist/input-binding/color/util';

function shouldSupportAlpha(
	initialValue: Float32Array,
): boolean {
	return initialValue.length === 4;
}


function writeRgbaColorObject(target: BindingTarget, value: Color, type: ColorType): void {
	const cc = mapColorType(value, type);
  const obj = cc.toRgbaObject();
  target.writeProperty('0', obj.r);
  target.writeProperty('1', obj.g);
  target.writeProperty('2', obj.b);
  target.writeProperty('3', obj.a);
}

function writeRgbColorObject(target: BindingTarget, value: Color, type: ColorType): void {
  const cc = mapColorType(value, type);
  const obj = cc.toRgbaObject();
  target.writeProperty('0', obj.r);
  target.writeProperty('1', obj.g);
  target.writeProperty('2', obj.b);
}

function isVecColor(v: any): v is Float32Array {
  return (v.constructor === Float32Array && (v.length === 3 || v.length === 4))
}


function createColorObjectWriter(
  supportsAlpha: boolean,
	type: ColorType,
): BindingWriter<Color> {


  return (target, inValue) => {
		if (supportsAlpha) {
			writeRgbaColorObject(target, inValue, type);
		} else {
			writeRgbColorObject(target, inValue, type);
		}
	};
  
}


function createColorComponentsFromRgbVec(v: Float32Array): ColorComponents3 | ColorComponents4 {
  const comps:ColorComponents3 | ColorComponents4 = v.length===4 ? [v[0]*255.0, v[1]*255.0, v[2]*255.0, v[3]] : [v[0]*255.0, v[1]*255.0, v[2]*255.0];
  return comps
}


export function colorFromVec(value: unknown, type: ColorType): Color {
	if (!isVecColor(value)) {
		return mapColorType(IntColor.black(), type);
	}
	if (type === 'int') {
		const comps = createColorComponentsFromRgbVec(value);
		return new IntColor(comps, 'rgb');
	}
	if (type === 'float') {
		const comps = createColorComponentsFromRgbVec(value);
		return new FloatColor(comps, 'rgb');
	}
	return mapColorType(IntColor.black(), 'int');
}


function createColorObjectBindingReader(
	type: ColorType,
): BindingReader<IntColor> {
	return (value) => {
		const c = colorFromVec(value, type);
		return mapColorType(c, 'int');
	};
}

function createColorObjectFormatter(
	supportsAlpha: boolean,
	type: ColorType,
): Formatter<Color> {
	return (value) => {
		if (supportsAlpha) {
			return colorToObjectRgbaString(value, type);
		}
		return colorToObjectRgbString(value, type);
	};
}

interface ObjectColorInputParams extends ColorInputParams {
	colorType: ColorType;
}

/**
 * @hidden
 */
export const VecColorInputPlugin: InputBindingPlugin<
	IntColor,
	Float32Array,
	ObjectColorInputParams
> = createPlugin({
	id: 'input-color-f32',
	type: 'input',
	accept: (value, params) => {
		if (!isVecColor(value)) {
			return null;
		}
		const result = parseColorInputParams(params);
		return result
			? {
					initialValue: value,
					params: {
						...result,
						colorType: 'float',
					},
			  }
			: null;
	},
	binding: {
		reader: (args) => createColorObjectBindingReader(args.params.colorType),
		equals: equalsColor,
		writer: (args) =>
			createColorObjectWriter(
				shouldSupportAlpha(args.initialValue),
				args.params.colorType,
			),
	},
	controller: (args) => {
		const supportsAlpha = isRgbaColorObject(args.initialValue);
		return new ColorController(args.document, {
			colorType: args.params.colorType,
			expanded: args.params.expanded ?? false,
			formatter: createColorObjectFormatter(
				supportsAlpha,
				args.params.colorType,
			),
			parser: createColorStringParser('int'),
			pickerLayout: args.params.picker ?? 'popup',
			supportsAlpha: supportsAlpha,
			value: args.value,
			viewProps: args.viewProps,
		});
	},
});
