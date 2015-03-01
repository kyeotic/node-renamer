require('colors');

var path = require('path'),
	fs = require('fs'),
	Q = require('Q'),
	readDir = Q.denodeify(fs.readdir),
	stat = Q.denodeify(fs.stat),
	rename = Q.denodeify(fs.rename),
	dirToRead = process.cwd();

var args = process.argv.slice(2),
	regexFind = new RegExp(args[0], "gi"),
	regexReplace =args[1],
	shouldReplace = args[2] == 'replace';

console.log(args);

readDir(dirToRead)
	.then(function(files) {
		var promises =  files.map(function(file) {
			//console.log('Found File: ', file.cyan);
			return stat(path.join(dirToRead, file))
				.then(function(stat) {
					var newPath = file.replace(regexFind, regexReplace);
					if (!shouldReplace)
						console.log(file, newPath);
					return { isFile: stat.isFile(), oldPath: path.join(dirToRead, file), newPath: path.join(dirToRead, newPath)};
				});
		});
		return Q.allSettled(promises);
	}).then(function(results) { return results.map(function(r) { return r.value; }); })
	.then(function (files) {
		var promises = files.filter(function(stat) {
				return stat.isFile;
			}).map(function(file) {
				if (shouldReplace)
					return rename(file.oldPath, file.newPath);
				//console.log(file.oldPath, file.newPath);
			});

		return Q.allSettled(promises);
	})
	.fail(function(error) {
		console.log(error.toString().red.bold);
	}).done();
