var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var htmlreplace = require('gulp-html-replace');

gulp.task('scripts', function () {
  //script paths
  var jsFiles = 'js/*.js',
    jsDest = 'dist/js';

  return gulp.src(jsFiles)
    .pipe(concat('scripts.min.js'))
    .pipe(uglify({ mangle: true, compress: true }))
    .pipe(gulp.dest(jsDest));
});

gulp.task('replace', function () {
  return gulp.src('index.html')
    .pipe(htmlreplace({
      'js': 'js/scripts.min.js',
      'modals': {
        src: gulp.src('modals/*.html')
      }
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy', function () {
  gulp.src('css/*').pipe(gulp.dest('dist/css'));
  gulp.src('font/*').pipe(gulp.dest('dist/font'));
  gulp.src('img/*').pipe(gulp.dest('dist/img'));
  gulp.src('favicon.ico').pipe(gulp.dest('dist'));
});

gulp.task('build', function () {
  gulp.start('scripts');
  gulp.start('replace');
  gulp.start('copy');
});