'use strict';

var gulp = require('gulp');
var pug = require('gulp-pug');

gulp.task('html', function () {
  return gulp.src(['./browser/views/**/*.pug', '!./browser/views/**/_*.pug'])
    .pipe(pug())
    .pipe(gulp.dest(function (file) {
      return './browser/'
    }));
});

gulp.task('watch', function(){
  gulp.watch('./browser/views/**/*.pug', ['html']);
})

gulp.task('build', ['html']);
