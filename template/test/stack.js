/**
 * ���ʽ
 * @enum  
 */
var expr = {
    'if': 0,
    'else': 1,
    'for': 2,
    'in': 3
};

/**
 * ģ���ջ
 * @class  
 * @param {String} str ģ���﷨
 */
var stack = function(str){
    this.charactors = str.split('');
};

S.mix(stack.prototype, {

    /**
     * ��ȡջ�����λԪ��
     * @public  
     * @return ����ջ�����λԪ��
     */
    peek: function(){
        return this.charactors[this.charactors.length-1];
    },

    /**
     * �������һ��Ԫ��
     * @public  
     * @return {Object} ���ص�����Ԫ��
     */
    pop: function(){
        return this.charactors.pop();
    },

    /**
     * ����ջ�����Ԫ��
     * @public  
     * @param {Object} o ����Ԫ��
     */
    push: function(o){
        this.charactors.push(o);
    },

    /**
     * ����ջ�Ƿ�Ϊ��
     * @public  
     * @return {Boolean} ��ջ�Ƿ�Ϊ��
     */
    isEmpty: function(){
        return this.charactors.length > 0;
    }

});

/**
 * ������
 * @class  
 */
var parser = function(str){
    self.stack = new stack(str);
};

S.mix(parser.prototype, {
    parse: function(data){
    }
});

/**
 * ����ģ�崦��ľ�̬��������Ϊ�﷨��
 * @static  
 */
S.mix(parser, {

    /**
     * �������ʽ
     * @static
     * @public
     * @param {stack} ����ջ
     */
    expr: function(){
        //
    },

    /**
     * ��������
     * @static
     * @public
     * @param {static} ����ջ  
     */
    vari: function(){
        //
    }

});

var s = new stack('<li class="item"><div class="pic"><a title="{TITLE}" href="{EURL}" target="_blank"><img src="{TBGOODSLINK}"></a></div><div class="price"><strong>{GOODSPRICE}</strong></div><div class="title"><a title="{TITLE}" href="{EURL}" target="_blank">{TITLE}</a></div></li>');
//S.log(s.charactors);
