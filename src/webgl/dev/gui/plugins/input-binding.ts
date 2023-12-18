

import { createSliderTextProps ,SliderInputBindingApi, createPlugin, BindingTarget, CompositeConstraint, Constraint, createRangeConstraint, findConstraint, InputBindingPlugin, ListParamsOptions, NumberInputParams, NumberTextController, parseListOptions, parseNumber, SliderTextController, ValueMap, DefiniteRangeConstraint, InputBindingController, ListConstraint, ListController, ListInputBindingApi, createListConstraint, createNumberTextInputParamsParser, createNumberTextPropsObject, createStepConstraint, createValue, parseRecord } from "@tweakpane/core";
import Input, { Constant, Uniform } from "nanogl-pbr/Input";


export function numberFromInput(value: unknown): number {
  
  if (value instanceof Input ) {
    const param = value.param
   
    if( param instanceof Constant ) {
      return param.value as number
    }
    
    if( param instanceof Uniform ) {
      return param.value[0]
    }
    
  }

	return 0;
}


function writeInput(
	target: BindingTarget,
	value: number,
): void {
	const input = target.read() as Input
  const param = input.param
  if( !(param instanceof Uniform) ) {
    input.attachUniform().set(value)
  } else {
    param.set(value)
  }
}


function createConstraint(
	params: NumberInputParams,
	initialValue: number,
): Constraint<number> {
	const constraints: Constraint<number>[] = [];

	const sc = createStepConstraint(params, initialValue);
	if (sc) {
		constraints.push(sc);
	}
	const rc = createRangeConstraint(params);
	if (rc) {
		constraints.push(rc);
	}
	const lc = createListConstraint<number>(params.options);
	if (lc) {
		constraints.push(lc);
	}

	return new CompositeConstraint(constraints);
}

/**
 * @hidden
 */
export const InputChunkPlugin: InputBindingPlugin<
	number,
	Input,
	NumberInputParams
> = createPlugin({
	id: 'input-chunk',
	type: 'input',
	accept: (value, params) => {

    if (! (value instanceof Input )) {
      return null;
    }
    
    if( value.size !== 1 ) {
      return null;
    }

		const result = parseRecord<NumberInputParams>(params, (p) => ({
			...createNumberTextInputParamsParser(p),
			options: p.optional.custom<ListParamsOptions<number>>(parseListOptions),
			readonly: p.optional.constant(false),
		}));
		return result
			? {
					initialValue: value,
					params: result,
			  }
			: null;
	},
	binding: {
		reader: (_args) => numberFromInput,
		writer: (_args) => writeInput,
		constraint: (args) => createConstraint(args.params, numberFromInput( args.initialValue) ),
	},
	controller: (args) => {
		const value = args.value;
		const c = args.constraint;

		const lc = c && findConstraint<ListConstraint<number>>(c, ListConstraint);
		if (lc) {
			return new ListController(args.document, {
				props: new ValueMap({
					options: lc.values.value('options'),
				}),
				value: value,
				viewProps: args.viewProps,
			});
		}

		const textPropsObj = createNumberTextPropsObject(
			args.params,
			value.rawValue,
		);

		const drc = c && findConstraint(c, DefiniteRangeConstraint);
		if (drc) {
			return new SliderTextController(args.document, {
				...createSliderTextProps({
					...textPropsObj,
					keyScale: createValue(textPropsObj.keyScale),
					max: drc.values.value('max'),
					min: drc.values.value('min'),
				}),
				parser: parseNumber,
				value: value,
				viewProps: args.viewProps,
			});
		}

		return new NumberTextController(args.document, {
			parser: parseNumber,
			props: ValueMap.fromObject(textPropsObj),
			value: value,
			viewProps: args.viewProps,
		});
	},
	api(args) {
		if (typeof args.controller.value.rawValue !== 'number') {
			return null;
		}

		if (args.controller.valueController instanceof SliderTextController) {
			return new SliderInputBindingApi(
				args.controller as InputBindingController<number, SliderTextController>,
			);
		}
		if (args.controller.valueController instanceof ListController) {
			return new ListInputBindingApi(
				args.controller as InputBindingController<
					number,
					ListController<number>
				>,
			);
		}

		return null;
	},
});
