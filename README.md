# ng-download
angular's download module

Docs
http://danml.com/download.html

# Getting-Started
Import ng-download and angular.
```
import angular from 'angular';
import ngDownload from 'ng-mosaic';
```

Ensure that your application module specifies ngDownload as a dependency:
```
angular.module(MODULE_NAME, ['ngDownload'])
	.controller(CONTROLLER_NAME, ['$download', function($download) {
		$download.download(data, fileName, mineType);
	}]);

```

# method: download Params
 * @param {string} The Blob, File, String, or dataURL containing the soon-to-ba File's contents.
 * @param {string} The name of the file to be created. Note that older browsers (like FF3.5, Ch5) don't honor the file name you provide, instead they automatically name the downloaded file.
 * @param {string} The MIME content-type of the file to download. While optional, it helps the browser present friendlier information about the download to the user, encouraging them to accept the download.