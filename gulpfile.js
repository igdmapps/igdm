'use strict';

var gulp = require('gulp');
var pug = require('gulp-pug');

gulp.task('html', function () {
  return gulp.src(['./browser/views/**/*.pug', '!./browser/views/**/_*.pug'])
    .pipe(pug())
    .pipe(gulp.dest(function (file) {
      return file.base.split('views\\')[0] + file.base.split('views\\')[1];
    }));
});

gulp.task('bootstrap', function () {
  return gulp.src(['./node_modules/bootstrap/dist/css/bootstrap.min.css'])
    .pipe(gulp.dest(function (file) {
      return './browser/css';
    }));
});

gulp.task('watch', function(){
  gulp.watch('./browser/views/**/*.pug', ['html']);
})

gulp.task('build', ['html', 'bootstrap']);
