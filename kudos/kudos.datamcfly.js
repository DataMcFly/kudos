(function(exports, undefined){

    // replace this api info with yours!!
	var datamcflyKudos = new DataMcFly("YOUR-API-KEY", "YOUR-APP", "kudos");
	var key = document.location.pathname.replace(/[\/-]/g,'');

    // fix for local debugging
    if(key === ''){
        key = 'localhost'
    }
	
	function createUUID() {
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";
		
		var uuid = s.join("");
		return uuid;
	}
	
	function getAuthData(){
		if( localStorage.getItem("uuid") === null) {
			var uuid = createUUID();
			localStorage.setItem("uuid",uuid);
			return uuid;
		}else{
			return localStorage.getItem("uuid");
		}
	}
	var uid = getAuthData();

    var hasVoted = function(){
		var deferred = $.Deferred();
		datamcflyKudos.where({'key' : key,'uid' : uid}).limit(1).on('value', function(data){
			deferred.resolve( data.count() !== null);
		});
		return deferred.promise();
	};

    var addKudo = function(){
		datamcflyKudos.set({
			'key' : key,
			'uid' : uid,
			'likes' : 1
		});
	};
	
    var removeKudo = function(){
		datamcflyKudos.where({'key' : key,'uid' : uid}).on('value', function(data){
			if( data.count() ){
				data.forEach( function(snapshot){
					var doc = snapshot.value();
					datamcflyKudos.deleteDocument( doc._id );
				});
			}
		});
	};

    // listening for updates
    var onKudoUpdates = function(cb){
		var likeCount = 0;
		datamcflyKudos.where({'key' : key}).on('value', function(data){
			likeCount = data.count();
			cb( likeCount );
		});

		datamcflyKudos.on('added', function(data){
			//	make sure this update was only for this document, ignore all others...
			if( data.value().key == key ){
				likeCount = likeCount + 1;
				cb( likeCount );
			}
		});

		datamcflyKudos.on('removed', function(data){
			//	make sure this update was only for this document, ignore all others...
			if( data.value().key == key ){
				likeCount = likeCount - 1;
				cb( likeCount );
			}
		});
    };

    var datamcflyStorage = {
        hasVoted: hasVoted,
        addKudo: addKudo,
        removeKudo: removeKudo,
        onKudoUpdates: onKudoUpdates
    };

    exports.datamcflyStorage = datamcflyStorage;

})(window);