'use strict';

const gulp = require('gulp');
const pug = require('gulp-pug');
const electron = require('electron-connect').server.create();

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
      return './docs/' + (base[1] ? base[1] : '');
    }));
});

gulp.task('watch-electron', function () {
    // Start browser process
    electron.start();
    // Restart browser process
    gulp.watch('./main/*', electron.restart);
    gulp.watch('./browser/js/**/*.js', electron.restart);
    gulp.watch('./browser/css/**/*.css', electron.restart);
    gulp.watch('./browser/views/**/*.pug', electron.restart);
    gulp.watch('./docs-src/**/*.pug', electron.restart);
    // Reload renderer process
    gulp.watch(['./browser/index.html'], electron.reload);
});

gulp.task('build', gulp.series('html'));

gulp.task('default', gulp.series('html', 'watch-electron'))
