'use strict';

var gulp = require('gulp');
var pug = require('gulp-pug');

gulp.task('html', function () {
  return gulp.src(['./views/**/*.pug', '!./views/**/_*.pug'])
    .pipe(pug())
    .pipe(gulp.dest(function (file) {
      return file.base.split('views\\')[0] + 'browser\\' + file.base.split('views\\')[1];
    }))
});

gulp.task('watch', function(){
  gulp.watch('./views/**/*.pug', ['html']); 
})

gulp.task('build', ['html']);
