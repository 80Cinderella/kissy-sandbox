KISSY.add('slide-down-banner', function (S, undefined){
	var S = KISSY, DOM = S.DOM, Event = S.Event;


	function SlideDownBanner(container, config){
		var defaultConfig = {
			duration: 1,
			stay: 3,
			autoFold: true,
			imageSrc: '',
			link: '',
			callback: null
		}

		config = config || {};
		config = S.merge(defaultConfig, config);
		this.config = config;

		this.container = DOM.get('#'+container);

		this._init();
	}

	S.augment(SlideDownBanner, S.EventTarget, {

		_init: function (){

			var self = this, config = self.config;
			if (!self.container) return;

			KISSY.ready(function (){
				self.container.appendChild(DOM.create('<a href="' + config.link + '" target="_blank"><img src="' + config.imageSrc + '" /></a>'));

				self.anim = self.anim || {};

				// 这里的ready是针对上面嵌入一张图片，在它load以后再操作
				KISSY.ready(function (){
					var bannerImage = DOM.get('img', self.container);
					config.bannerImageHeight = bannerImage.offsetHeight;

					DOM.css(self.container, {height: 0, overflow: 'hidden'});

					// 绑定展开完成后的自定义事件
					self.on('bannerExpanded', function (){
						this.anim['id-timeout-for-folding'] = S.later(function (){
							self.fold();
						}, config.stay * 1000, false, self, null);
					})

					// 展开下拉横幅
					self.expand();
				});
			});
		},

		// 展开
		expand: function (){
			var self = this, config = self.config, animObjectId = 'id-expand-banner';

			self.anim[animObjectId] = new S.Anim(self.container, {height: config.bannerImageHeight + 'px'}, config.duration, 'easeOut', function (){
				self.anim[animObjectId] = undefined;
				self.fire('bannerExpanded', self);
			}).run();
		},

		// 收起
		fold: function (){
			var self = this, config = self.config, animObjectId = 'id-fold-banner';

			self.anim[animObjectId] = new S.Anim(self.container, {height: 0}, config.duration, 'easeIn', function (){
				self.anim[animObjectId] = undefined;
				self.fire('bannerFolded', self);

				config.callback();	// 更多时候，我们可以直接用这个，因为它很方便
			}).run();
		}

	});

	S.SlideDownBanner = SlideDownBanner;

});