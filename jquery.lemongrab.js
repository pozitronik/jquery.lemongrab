/*! Lemongrab v 08.10.14 | (c) 2013-2014 Pavel Dubrovsky*/

(function( $ ) {
	var
	ValidState=false,
	RequiredState=false,
	VisibleState=false,
	FORM,//Глобальный (для плагина) объект формы, на которую он натравлен
	ACCEPTABLE;


	jQuery.fn.lemongrab = function(options,RULES) {
		ACCEPTABLE=$.extend({	"subselector":"*",
													"classValid":"ACCEPTABLE",
													"classInvalid":"UNACCEPTABLE",
													"classRequired":"REQUIRED",
													"classNorequired":"NOREQUIRED",
													"classEnabled":"ENABLED",
													"classDisabled":"DISABLED",
													"classVisible":"VISIBLE",
													"classHidden":"HIDDEN",
													"classChanged":"CHANGED",
													"classUnchanged":"UNCHANGED",
													"action":"input",
													"actions":{},
													"onAction":false,
													"allowInvalidSubmit":true,
													"useRequiredAttr":true,
													"nativeEnabled":true,
													"nativeVisible":true,
													"autograb":true
													
												},options);
		FORM=this;
		
		var rule,conditions,selector_count,conditions_count,rule_options={},lemons,lemon,rules;
		
		//если в RULES что-то задано - считаем, что там JSON, парсим его.
		if (typeof(RULES)!=='undefined' && RULES!=='') {
			var for_selector;
			for (selector_count=0;selector_count<RULES.length;selector_count++){//Разбиваем переданный параметр на селекторы
				for_selector=RULES[selector_count].selector;
				//Перебираем все условия валидации
				for (e_rule in RULES[selector_count].rule) {
					rule=e_rule.toUpperCase();
					conditions=RULES[selector_count].rule[e_rule];
					//В conditions-набор условий правила. В rule-само правило.
					rule_options={};
					for (conditions_count=0;conditions_count<conditions.length;conditions_count++){//Пройдёмся по условиям, дополнив умолчания. Можно использовать существующий объект
						rule_options[conditions_count]=complete_condition(conditions[conditions_count]);
					}
					rule_options.actions=RULES[selector_count].actions;
					apply_rule($(for_selector),rule,rule_options);
				}
			}
		}
		
		lemons=FORM.find(ACCEPTABLE.subselector);
		lemons.each(function(){
			lemon=$(this);
			rules=lemon.data();//Получили список data-атрибутов
			for (var rule_ in rules) {
				conditions=rules[rule_];
				switch (rule_){
					case 'ruleValid':
						rule="VALID";
					break;
					case 'ruleRequired':
						rule="REQUIRED";
					break;
					case 'ruleEnabled':
						rule="ENABLED";
					break;
					case 'ruleVisible':
						rule="VISIBLE";
					break;
					case 'ruleLemongrab': //Отдельный случай: одно большое правило
						var parameters=conditions,
								parameter;
						for (parameter in parameters) {
							conditions=parameters[parameter];
							switch (parameter){
								case 'valid':
									rule="VALID";
								break;
								case 'required':
									rule="REQUIRED";
								break;
								case 'enabled':
									rule="ENABLED";
								break;
								case 'visible':
									rule="VISIBLE";
								break;
							}
							//В conditions-набор условий правила. В rule-само правило.
							rule_options={};
							for (conditions_count=0;conditions_count<conditions.length;conditions_count++){//Пройдёмся по условиям, дополнив умолчания. Можно использовать существующий объект
								rule_options[conditions_count]=complete_condition(conditions[conditions_count]);
							}
							apply_rule(lemon,rule,rule_options);
						}
					break;
				}
				//В conditions-набор условий правила. В rule-само правило.
				rule_options={};
				for (conditions_count=0;conditions_count<conditions.length;conditions_count++){//Пройдёмся по условиям, дополнив умолчания. Можно использовать существующий объект
					rule_options[conditions_count]=complete_condition(conditions[conditions_count]);
				}
				//rule_options.actions=RULES[selector_count].actions;
				apply_rule(lemon,rule,rule_options);
			}
		});
		ValidState=FORM.isValid();
		RequiredState=!FORM.isNotRequired();
		VisibleState=FORM.is(':visible');
		//Устанавливаем обработчик onsubmit
		FORM.on('submit',function(){
			if (!FORM.isNotRequired()) return (false);
			if (FORM.isValid()) return (true);
			return (ACCEPTABLE.allowInvalidSubmit===true);
		});
	};

	jQuery.fn.isValid = function(){
		return (this.find("."+ACCEPTABLE.classInvalid).length===0);
	};
	
	jQuery.fn.isNotRequired = function(){
		return (this.find("."+ACCEPTABLE.classRequired).length===0);
	};
	
	function complete_condition(condition){//Проверяет условие на все параметры, дополняет умолчательными. TODO: разрешить использовать сокращённую запись (& вместо and и тд).
		condition.key=(condition.key||'native');//Получаем ключ правила, если не задан - считаем, что там нативный JS.
		
		condition.invert=(condition.invert||false);//Инвертировать ли полученное значение.
		if (condition.key[0]==='!') {//Инвертирование может быть задано в ключе. В случае, если оно задано и в ключе, и в параметре, ключ имеет приоритет
			condition.invert=true;
			condition.key=condition.key.substr(1);
		}
		
		switch (condition.key.toLowerCase()){//Задаём алиасы ключей
			case 'r':
			case 'regexp':
				condition.key="regexp";
			break;
			case 'c':
			case 'checked':
			case 'checkbox':
			case 'radio':
				condition.key="checked";
			break;
			case 'select':
			case 's':
				condition.key="select";
			break;
			case 'set':
				condition.key="set";
			break;
			case 'j':
			case 'n':
			case 'f':
			case 'javascript':
			case 'native':
			case 'function':
				condition.key="native";
			break;
		}
		
		if (condition.key==="select"){//Нужно проверить, что в value
			var i,tmp_value="[";
			if (typeof(condition.value)==='object'){//Отлично, это массив
				for (i=0;i<condition.value.length;i++){
					tmp_value+="\""+condition.value[i]+"\",";
				}
			} else if (typeof(condition.value)==='string'){//Это не массив, но мы добры к пользователю
				condition.value=condition.value.split(',');
				for (i=0;i<condition.value.length;i++){
					tmp_value+="\""+condition.value[i]+"\",";
				}
			} else {
				tmp_value="[ ";
			}
			condition.value=tmp_value.substr(0,tmp_value.length-1)+"]";
		} else if (condition.key==="set") {
			condition.value=(condition.value||[""]);
		}

		condition.selector=(condition.selector||'');//Селектор связуемого поля, если не задан - привязываемся к полю правила.
		condition.strict=(condition.strict||false);//Строгость проверки для select/set
		condition.logic=(condition.logic||'&&');//Логика совмещения правил
		condition.min=(condition.min||false);/*минимальное*/
		condition.max=(condition.max||false);/*и максимальное количество выбранных значений*/
		
		switch (condition.logic.toLowerCase()) {
			default:
			case "&":
			case "&&":
			case "and":
				condition.logic="&&";
			break;
			case "|":
			case "||":
			case "or":
				condition.logic="||";
			break;
		}
		return (condition);
	}

	/*Возвращает в виде массива набор значений указанного <select>
		Входное значение - jQuery-объект с селектом
	*/
	function get_selected_options(select){
		var	options=select.find("option:selected"),
				option_count,
				ret=[];
		for (option_count=0;option_count<options.length;option_count++){
			ret.push($(options[option_count]).val());
		}
		return (ret);
	}
	
	/*
		проверяет, чекнуты ли в block поля, отмеченные в selectors.
		если strict==true, считается норм, если чекнуто хотя бы одно поле, попадающее под каждый селектор
		иначе должны быть чекнуты все поля, попадающие в селектор
	*/
	function is_fields_checked(block,selectors,strict){
		if (typeof(strict)==='undefined') strict=false;
		var index,selector,cl=0;
		for (index=0;index<selectors.length;index++){
			selector=selectors[index];
			cl+=block.find(selector+':checked').length;//Количество чекнутых для прошлого селектора не сбрасываем
			if (strict) {//TODO: условие можно и сократить для компактности
				if (cl!==block.find(selector).length) return (false);
			} else {
				if (cl>block.find(selector).length || cl===0) return (false);
			}
		}
		return (true);
	}
	
	/*
	 * По заданному набору параметров генерирует JS-код условия
	*/
	function get_js_condition (condition,field){
		var ret={
			handler:[],
			condition:""
		},_condition,summary_selector,index;
		
		switch (condition.key.toLowerCase()){
			case 'regexp':
				if (condition.selector!=='') {//Задан селектор внешнего поля, дополнительно вешаем обработчик на него
					ret.condition = "RegExp(/"+condition.value+"/).test($('"+condition.selector+"').val())";
					ret.handler.push("$('"+condition.selector+"')");
				} else {//Селектор не задан, проверяем собственное поле
					ret.condition = "RegExp(/"+condition.value+"/).test(field.val())";//field дальше будет обрабатываться eval
				}
			break;
			case 'checked':
				if (condition.selector!=='') {//Задан селектор внешнего поля, дополнительно вешаем обработчик на него
					ret.condition = "$('"+condition.selector+"').is(':checked')";
					ret.handler.push("$('"+condition.selector+"')");
				} else {//Селектор не задан, проверяем собственное поле
					ret.condition = "field.is(':checked')";
				}
			break;
			case 'select':
				_condition='';
				//В condition.value должен быть массив переведённый в строку - об этом заботимся в complete_condition
				if (condition.selector!=='') {//Задан селектор внешнего поля, дополнительно вешаем обработчик на него
					if (condition.min) {//Генерируем условие для min, если оно задано
						_condition+=" && (get_selected_options($('"+condition.selector+"')).length >= "+condition.min+")";
					}
					if (condition.max) {//Генерируем условие для max, если оно задано
						_condition+=" && (get_selected_options($('"+condition.selector+"')).length <= "+condition.max+")";
					}
					ret.condition = condition.value+".equals (get_selected_options($('"+condition.selector+"')),"+condition.strict+")"+_condition;
					ret.handler.push("$('"+condition.selector+"')");
				} else {//Селектор не задан, проверяем собственное поле
					
					if (condition.min) {//Генерируем условие для min, если оно задано
						_condition+=" && (get_selected_options(field).length >= "+condition.min+")";
					}
					if (condition.max) {//Генерируем условие для max, если оно задано
						_condition+=" && (get_selected_options(field).length <= "+condition.max+")";
					}
					ret.condition = condition.value+".equals (get_selected_options(field),"+condition.strict+")"+_condition;
				}
			break;
			case 'set':
				_condition='';
				summary_selector='';
				//Поскольку в condition.value должен быть массив селекторов, нужно разобрать его, сделав один большой селектор
				for (index=0;index<condition.value.length;index++){
					summary_selector+=", "+condition.value[index]+":checked";
				}
				summary_selector=summary_selector.substr(1);
				
				if (condition.selector!=='') {//Задан селектор внешнего поля, дополнительно вешаем обработчик на него
					if (condition.min) {//Генерируем условие для min, если оно задано
						_condition+=" && ($('"+condition.selector+summary_selector+"').length >= "+condition.min+")";
					}
					if (condition.max) {//Генерируем условие для max, если оно задано
						_condition+=" && ($('"+condition.selector+summary_selector+"').length <= "+condition.max+")";
					}
					ret.condition = "is_fields_checked($('"+condition.selector+"'),"+ JSON.stringify(condition.value)+","+condition.strict+")"+_condition;
					/*Для блоков требуется эмулировать onchange, поэтому передаём вот такой селектор*/
					ret.handler.push("$('"+condition.selector+"').find('input[type=checkbox], input[type=radio]')");
				} else {//Селектор не задан, проверяем собственное поле
					if (condition.min) {//Генерируем условие для min, если оно задано
						_condition+=" && (field.find('"+summary_selector+"').length >= "+condition.min+")";
					}
					if (condition.max) {//Генерируем условие для max, если оно задано
						_condition+=" && (field.find('"+summary_selector+"').length <= "+condition.max+")";
					}
					ret.condition = "is_fields_checked(field,"+ JSON.stringify(condition.value)+","+condition.strict+")"+_condition;
					/*Для блоков требуется эмулировать onchange, поэтому передаём вот такой селектор*/
					ret.handler.push("field.find('input[type=checkbox], input[type=radio]')");
				}
			break;
			case 'native':
				ret.condition=condition.value;
				if (condition.selector!=='') { //Задан селектор внешнего поля, дополнительно вешаем обработчик на него
					ret.handler.push("$('"+condition.selector+"')");
				}
			break;
		}
		ret.handler.push("field");
		if (condition.invert) {
			ret.condition=condition.logic+" !("+ret.condition+")";
		} else {
			ret.condition=condition.logic+" ("+ret.condition+")";
		}
		return (ret);
		
	}

	/*
	 * field - jQuery-объект поля, к которому применяется правило
	 * rule - применяемое правило
	 * conditions - набор условий, при которых правило применяется
	*/
	function apply_rule(field,rule,conditions){
		var summary_conditions={
			condition:"",
			handler:[]
		},
		js_condition,i,h,condition, action;
		for (condition in conditions){
			if ($.isNumeric(condition)) js_condition=get_js_condition(conditions[condition],field);//В conditions может быть нецифровой параметр, дополняющий набор правил
			summary_conditions.condition+=" "+js_condition.condition;
			for (i=0;i<js_condition.handler.length;i++){//Избавляемся от навешиваний одинаковых обработчиков на одно поле
				if (!summary_conditions.handler.object_in_array(js_condition.handler[i])) summary_conditions.handler.push(js_condition.handler[i]);
			}
		}
		//Обрезаем от условия первые четыре символа с первым ненужным условием. Если будет глючить - переписать регуляркой.
		summary_conditions.condition=summary_conditions.condition.substr(4);
		for (i=0;i<summary_conditions.handler.length;i++){
			h=(summary_conditions.handler[i]==='')?field:eval(summary_conditions.handler[i]);//На всякий случай
			
			action=get_rule_action(rule,conditions.actions);//Получим событие, заданное в правиле непосредственно 
			action+=" "+get_rule_action(rule,ACCEPTABLE.actions);//Получим событие, заданное для всех правил
			
			switch (checkable(h)){//Получим глобальное правило + правила для "особенных" элементов
				case 0:
					action+=" "+ ACCEPTABLE.action;
				break;
				case 1:
					action= "change";
				break;
				case 2://С радиокнопками всё плохо, у них нет нормального onChange
					if (h.attr('name')!=='undefined') h=$('input[name="'+h.attr('name')+'\"]');
					action+=" "+ "change";
				break;
				case 3://Для селектов нужно обрабатывать оба события
					action+=" "+ ACCEPTABLE.action+" change";
				break;
			}
			
			
			
			h.on(action,function(){
				var x=set_class(field,rule,eval(summary_conditions.condition));
				if (x) {
					h.trigger(x.action+x.rule);
				}
				if (ACCEPTABLE.onAction) ACCEPTABLE.onAction(field);
				initiateEvents(FORM);
				if (ACCEPTABLE.classUnchanged!==false)h.removeClass(ACCEPTABLE.classUnchanged);
				if (ACCEPTABLE.classChanged!==false) h.addClass(ACCEPTABLE.classChanged);
			});
			
			if (ACCEPTABLE.classUnchanged!==false) h.addClass(ACCEPTABLE.classUnchanged);
			
			if (ACCEPTABLE.autograb) {
				var a=action.split(' ');
				$(a).each (function(val){
					h.trigger(a[val]);//Инициализация состояния
				});
			}
			
		}
	}
	
	function get_rule_action(rule,actions) {
		if (typeof(actions)==='undefined') return "";
		return(actions[rule.toLowerCase()]||"");
	}
	
	//Возвращает true, если переданный элемент поддерживает только onChange
	function checkable(field){
		//TODO: Проверить, что будет, если в field много полей
		if (field.is('[type=checkbox]')) {
			return (1);
		} else if (field.is('[type=radio]')) {
			return (2)
		} else if (field.is('select')) {
			return (3);
		} else return (0);
	}
	/**
	 * Проверяет, произошло ли переключение состояния для valid и required, если произошло - инициирует соответствующее событие. Состояние visible проверяется непосредственно в setClass
	**/
	function initiateEvents(lemonform){
		var	cur_valid=lemonform.isValid(),
				cur_require=!lemonform.isNotRequired(),
				cur_visible=lemonform.is(':visible');
		if (cur_valid && !ValidState) {
			lemonform.trigger('lemongrab.valid');
			ValidState=true;
		} else if (!cur_valid && ValidState) {
			lemonform.trigger('lemongrab.novalid');
			ValidState=false;
		}
		if (cur_require && !RequiredState) {
			lemonform.trigger('lemongrab.require');
			RequiredState=true;
		} else if (!cur_require && RequiredState) {
			lemonform.trigger('lemongrab.norequire');
			RequiredState=false;
		}
	}
	
	//Проверяет, есть ли точно такой же объект в массиве (вплоть до значений полей).
	Array.prototype.object_in_array = function(srch) {
		var i;
		for(i=0; i < this.length; i++) {
			if (typeof(this[i])==='object'){
				//Обойдёмся без рекурсии. Если понадобится рекурсия: http://javascript.ru/forum/misc/10792-sravnenie-obektov-2.html#post209343
				if (JSON.stringify(this[i])===JSON.stringify(srch)) {
					return true;
				}
			}
		}
		return false;
	};
	
	/*
	 * Сравнивает двумерные массивы между собой. Массивы трактуются как множества - т.е. одинаковыми считаются массивы с равным количеством элементов и их одинаковыми значениями, но порядок элементов может быть разный, т.е. [1,2,3]===[2,1,3]
	 * strict задаёт строгость вхождения. false - array может быть подмножеством, true - должен точно совпадать
	*/
	Array.prototype.equals = function (array,strict){
		if (typeof(strict)==='undefined') strict=false;
		if ((strict && this.length!==array.length)||(!strict && this.length>array.length)) return (false);
		
		var i;
		if (!Array.prototype.indexOf) {/*честно скопипащено из интернетов и не проверялось, т.к. все современные браузеры должны поддерживать indexOf*/
			Array.prototype.indexOf = function(elt /*, from*/) {
				var len = this.length >>> 0;
				var from = Number(arguments[1]) || 0;
				from = (from < 0) ? Math.ceil(from) : Math.floor(from);
				if (from < 0) from += len;
				for (; from < len; from++){
					if (from in this && this[from] === elt) return from;
				}
				return -1;
			};
		}
		
		for (i=0;i<this.length;i++){
			if(array.indexOf(this[i])===-1) return (false);
		}
		return (true);
	};
	
	/**
	 * Меняет класс и сообщает, произошло ли изменение состояния.
	 */

	function set_class(field,rule,setc){
		var ret=false;
		var positiveClass,negativeClass;
		if (typeof(rule)==='undefined') return(0);
		switch (rule){
			case 'VALID':
				positiveClass=ACCEPTABLE.classValid;
				negativeClass=ACCEPTABLE.classInvalid;
			break;
			case 'REQUIRED':
				positiveClass=ACCEPTABLE.classRequired;
				negativeClass=ACCEPTABLE.classNorequired;
			break;
			case 'ENABLED':
				positiveClass=ACCEPTABLE.classEnabled;
				negativeClass=ACCEPTABLE.classDisabled;
			break;
			case 'VISIBLE':
				positiveClass=ACCEPTABLE.classVisible;
				negativeClass=ACCEPTABLE.classHidden;
			break;
		}
		if(setc){
			if (field.hasClass(negativeClass)) {
				ret={
					"rule":rule,
					"action":"SET"
				}
			}
		
			field.removeClass(negativeClass).addClass(positiveClass);
			if (rule==='REQUIRED' && ACCEPTABLE.useRequiredAttr) field.attr("required","required");
			if (rule==='ENABLED' && ACCEPTABLE.nativeEnabled ) field.removeAttr("disabled");
			if (rule==='VISIBLE' && ACCEPTABLE.nativeVisible) {
				field.show();
				field.trigger('lemongrab.visible');
			}
		} else {
		
			if (field.hasClass(positiveClass)) {
				ret={
					"rule":rule,
					"action":"REMOVE"
				}
			}
		
			field.removeClass(positiveClass).addClass(negativeClass);
			if (rule==='REQUIRED' && ACCEPTABLE.useRequiredAttr) field.removeAttr("required");
			if (rule==='ENABLED' && ACCEPTABLE.nativeEnabled ) field.attr("disabled","disabled");
			if (rule==='VISIBLE' && ACCEPTABLE.nativeVisible) {
				field.hide();
				field.trigger('lemongrab.hide');
			}
		}
		return (ret);
	}

}( jQuery ));
