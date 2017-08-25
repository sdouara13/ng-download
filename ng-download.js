(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory);
  } else if (root.hasOwnProperty('angular')) {
    factory(root.angular);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'));
  }
}(this , function (angular) {
  'use strict';
  angular = (angular && angular.module ) ? angular : window.angular;

  return angular.module('ngDownload', [])
  /**
   * @ngdoc object
   * @name ngDownload.download
   * @requires $document
   */
    .factory('$downloadService', [function() {

      return {
        /**
         * @ngdoc method
         * @name $download#download
         *
         * @description
         * Download the file from url
         *
         * @param {string} The Blob, File, String, or dataURL containing the soon-to-ba File's contents.
         * @param {string} The name of the file to be created. Note that older browsers (like FF3.5, Ch5) don't honor the file name you provide, instead they automatically name the downloaded file.
         * @param {string} The MIME content-type of the file to download. While optional, it helps the browser present friendlier information about the download to the user, encouraging them to accept the download.
         */
        download: function(data, strFileName, strMimeType) {

          var self = window, // this script is only for browsers anyway...
            defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
            mimeType = strMimeType || defaultMime,
            payload = data,
            url = !strFileName && !strMimeType && payload,
            anchor = document.createElement("a"),
            toString = function(a){return String(a);},
            myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
            fileName = strFileName || "download",
            blob,
            reader;
          myBlob= myBlob.call ? myBlob.bind(self) : Blob ;

          if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
            payload=[payload, mimeType];
            mimeType=payload[0];
            payload=payload[1];
          }


          if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
            fileName = url.split("/").pop().split("?")[0];
            anchor.href = url; // assign href prop to temp anchor
            if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
              var ajax=new XMLHttpRequest();
              ajax.open( "GET", url, true);
              ajax.responseType = 'blob';
              ajax.onload= function(e){
                download(e.target.response, fileName, defaultMime);
              };
              setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
              return ajax;
            } // end if valid url?
          } // end if url?


          //go ahead and download dataURLs right away
          if(/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)){

            if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
              payload=dataUrlToBlob(payload);
              mimeType=payload.type || defaultMime;
            }else{
              return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
                navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
                saver(payload) ; // everyone else can save dataURLs un-processed
            }

          }//end if dataURL passed?

          blob = payload instanceof myBlob ?
            payload :
            new myBlob([payload], {type: mimeType}) ;


          function dataUrlToBlob(strUrl) {
            var parts= strUrl.split(/[:;,]/),
              type= parts[1],
              decoder= parts[2] == "base64" ? atob : decodeURIComponent,
              binData= decoder( parts.pop() ),
              mx= binData.length,
              i= 0,
              uiArr= new Uint8Array(mx);

            for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

            return new myBlob([uiArr], {type: type});
          }

          function saver(url, winMode){

            if ('download' in anchor) { //html5 A[download]
              anchor.href = url;
              anchor.setAttribute("download", fileName);
              anchor.className = "download-js-link";
              anchor.innerHTML = "downloading...";
              anchor.style.display = "none";
              document.body.appendChild(anchor);
              setTimeout(function() {
                anchor.click();
                document.body.removeChild(anchor);
                if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
              }, 66);
              return true;
            }

            // handle non-a[download] safari as best we can:
            if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
              url=url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
              if(!window.open(url)){ // popup blocked, offer direct download:
                if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
              }
              return true;
            }

            //do iframe dataURL download (old ch+FF):
            var f = document.createElement("iframe");
            document.body.appendChild(f);

            if(!winMode){ // force a mime that will download:
              url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
            }
            f.src=url;
            setTimeout(function(){ document.body.removeChild(f); }, 333);

          }//end saver




          if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
            return navigator.msSaveBlob(blob, fileName);
          }

          if(self.URL){ // simple fast and modern way using Blob and URL:
            saver(self.URL.createObjectURL(blob), true);
          }else{
            // handle non-Blob()+non-URL browsers:
            if(typeof blob === "string" || blob.constructor===toString ){
              try{
                return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
              }catch(y){
                return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
              }
            }

            // Blob but not URL support:
            reader=new FileReader();
            reader.onload=function(e){
              saver(this.result);
            };
            reader.readAsDataURL(blob);
          }
          return true;
        }
      };

    }])

    .provider('$download', function () {
      var defaultOptions = {
        fileName: 'export-file.zip',
        data: '',
        mimeType: 'application/zip'
      };

      var globalOptions = {};

      this.options = function(value) {
        angular.extend(globalOptions, value);
      };

      this.$get = ['$downloadService', function ( $downloadService ) {
        return function $download(options) {
          return {
            scope: {
              downloadConfig: '='
            },
            compile: function() {
              return function link($scope, element) {
                var data;
                var fileName;
                var mimeType;
                $scope.$watch('downloadConfig', function ( newVal, oldVal ) {
                  setConfig();
                }, true);

                $(element[0]).on('click', function () {
                  $downloadService.download(data, fileName, mimeType);
                });

                function setConfig(  ) {
                  var config = angular.extend({}, defaultOptions, globalOptions, $scope.downloadConfig);
                  data = config.data;
                  fileName = config.fileName;
                  mimeType = config.mimeType;
                }
                setConfig();
              }
            }
          }
        }
      }]
    })

    .directive('download', [ '$download', function($download) {
      return $download();
    }]);


}));