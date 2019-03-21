var _osslogfunc = function() {
	var _osslog = window._osslog ? window._osslog : {};
	if(_osslog.tracker_api_path == undefined) {
		_osslog.tracker_api_path = (( ((typeof isDev != 'undefined') && isDev) || ((typeof _isdev != 'undefined') && _isdev))?'http://tiger.oa.com/tdl/':'http://tdl.oa.com/') + 'tbl/apis/tracker.php';
	}
	_osslog.system = _osslog.system ? _osslog.system : 'unknown';
	_osslog.user = _osslog.user ? _osslog.user : '';
	if (_osslog.user == '') {
	  _osslog.user = document.cookie.match(new RegExp("(^| )t_uid=([^;]*)(;|$)"));
	  _osslog.user = _osslog.user ? unescape(_osslog.user[2]) : '';
	}
	_osslog.url = window.location.href;
	_osslog.reference = document.referrer;
	
	var params = [];

	var keys = Object.keys(_osslog).sort();
	for (var index in keys) {
		var key = keys[index];
		if (_osslog.hasOwnProperty(key)) {
			params.push([key, _osslog[key]]);
		}
	}

	var params_string = '',
		to_encode = '';
	for (var x in params) {
		if (!params.hasOwnProperty(x)) {
			continue;
		}
		params_string += params[x][0] + '=' + encodeURIComponent(params[x][1]) + '&' ;
		to_encode += params[x][0] + params[x][1];
	}
	params_string = params_string + 't=' + (new Date()).valueOf();
	params_string += '&codec=' + CryptoJS.MD5(to_encode.toString(CryptoJS.enc.Utf8)).toString();
	var _ossimg = document.createElement('img');
	_ossimg.style.display = 'none';
	_ossimg.width = 0;
	_ossimg.src = _osslog.tracker_api_path + '?' + params_string.toString();
	//document.body.appendChild(_ossimg);
};
var _osslogWraper = function() {

	//timing
	if(typeof timing !== 'undefined'){
		var _performence_data = timing.getTimes();
		window._osslog.domReadyTime = _performence_data.domReadyTime || 0;
		window._osslog.lookupDomainTime = _performence_data.lookupDomainTime || 0;
		window._osslog.connectTime = _performence_data.connectTime || 0;
		window._osslog.requestTime = _performence_data.requestTime || 0;
		window._osslog.initDomTreeTime = _performence_data.initDomTreeTime || 0;	
	}

	if(typeof wx !== 'undefined'){
		wx.ready(function() {
			wx.getNetworkType({
				success: function (res) {
					
					//jssdk
					window._osslog.field1 = res.networkType;		//移动端用field1来记录网络类型
					window._osslog.field2 = navigator.userAgent;	//移动端用field2来记录user_agent

					//done
					_osslogfunc();
				}
			});
		});
	}else{
		_osslogfunc();
	}
};
if (window.addEventListener) {
  window.addEventListener('load', _osslogWraper, false);
} else if (window.attachEvent) {
  window.attachEvent('onload', _osslogWraper);
}

if (!Object.keys) {
  Object.keys = function(obj) {
    var keys = [];

      for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        keys.push(i);
      }
    }
    return keys;
  };
}