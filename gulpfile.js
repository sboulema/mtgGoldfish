var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlreplace = require('gulp-html-replace');

gulp.task('vendor', function(done) {
  jsSources = [
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
    'node_modules/flip/dist/jquery.flip.min.js',
    'node_modules/jquery-ui/dist/jquery-ui.min.js',
    'node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js',
    'node_modules/knuth-shuffle/index.js'
  ];

  cssSources = [
    'node_modules/bootstrap/dist/css/bootstrap.min.css',
    'node_modules/mana-font/css/mana.min.css'
  ];

  gulp.src(jsSources)
    .pipe(concat('vendor.bundle.js'))  
    .pipe(gulp.dest('dist/js'));

  gulp.src(cssSources)
    .pipe(concat('vendor.bundle.css'))  
    .pipe(gulp.dest('dist/css'));

  done();
});

gulp.task('scripts', function (done) {
  var jsFiles = 'js/*.js',
    jsDest = 'dist/js';

  gulp.src(jsFiles)
    .pipe(concat('scripts.min.js'))
    .pipe(uglify({ mangle: true, compress: true }))
    .pipe(gulp.dest(jsDest));

  done();
});

gulp.task('replace', function (done) {
  gulp.src('index.html')
    .pipe(htmlreplace({
      'js': 'js/scripts.min.js',
      'vendor-js': 'js/vendor.bundle.js',
      'vendor-css': 'css/vendor.bundle.css',
      'modals': {
        src: gulp.src('modals/*.html')
      }
    }))
    .pipe(gulp.dest('dist/'));

  done();
});

gulp.task('copy', function (done) {
  gulp.src('css/*').pipe(gulp.dest('dist/css'));
  gulp.src('fonts/*').pipe(gulp.dest('dist/fonts'));
  gulp.src('node_modules/mana-font/fonts/*', { removeBOM: false }).pipe(gulp.dest('dist/fonts'));
  gulp.src('img/*', { removeBOM: false }).pipe(gulp.dest('dist/img'));
  gulp.src('favicon.ico', { removeBOM: false }).pipe(gulp.dest('dist'));

  done();
});

gulp.task('build',
  gulp.parallel('vendor', 'scripts', 'replace', 'copy')
);