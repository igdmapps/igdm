'use strict';

var gulp = require('gulp');
var pug = require('gulp-pug');

gulp.task('html', function () {
  return gulp.src(['./browser/views/**/*.pug', '!./browser/views/**/_*.pug'])
    .pipe(pug({pretty: true}))
    .pipe(gulp.dest(function (file) {
      return './browser/'
    }));
});

gulp.task('website-html', function () {
  return gulp.src(['./docs-src/**/*.pug', '!./docs-src/**/_*.pug'])
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(function (file) {
      // Keeps folder and file structure intact
      let base = file.base.split('docs-src/');
      return base[0] + 'docs/' + base[1];
    }));
});

gulp.task('watch', function(){
  gulp.watch('./browser/views/**/*.pug', ['html']);
  gulp.watch('./docs-src/**/*.pug', ['website-html']);
})

gulp.task('build', gulp.series('html'));
