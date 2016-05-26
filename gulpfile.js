var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync'),
    prefix = require('gulp-autoprefixer'),
    plumber=require('gulp-plumber'),
    path = {
        sass: "static/scss/**",
        CSS: "static/source/css/",
        JSSrc: "static/scripts/**/*.js",
        JSDes: "static/source/js/",
        ejs: "views/**"
    };

gulp.task("serve", ["scss", "minifyjs"], function () {
    browserSync.init({
        proxy: 'http://127.0.0.1:3300'
    });
    gulp.watch(path.sass, ["scss"]);
    gulp.watch(path.JSSrc, ["minifyjs"]);
    gulp.watch(path.ejs, ["ejs"]);
    gulp.watch(path.CSS).on("change", function () {
        browserSync.reload();
    });
    gulp.watch(path.JSDes).on("change", function () {
        browserSync.reload();
    });
    gulp.watch(path.ejs).on("change", function () {
        browserSync.reload();
    });
});

gulp.task('scss', function () {
    gulp.src(path.sass)
        .pipe(plumber())
        .pipe(sass())
        .pipe(prefix('last 2 versions', '> 1%', 'ie 8', 'Android 2'))
        .pipe(minifycss())
        .pipe(concat('main.min.css'))
        .pipe(gulp.dest(path.CSS))
        .pipe(browserSync.stream());
});
gulp.task('minifyjs', function () {
    gulp.src(path.JSSrc)
        //.pipe(rename({suffix:'.min'}))
        //.pipe(uglify())
        .pipe(gulp.dest(path.JSDes))
        .pipe(browserSync.stream());
});

gulp.task("ejs", function () {
    gulp.src(path.ejs)
        .pipe(browserSync.stream());
});

gulp.task('default', ['scss', 'minifyjs', 'ejs'], function () {
    console.log("gulp build success.");
});

gulp.task('watch', ['serve'], function () {
    console.log("gulp watch success.");
});