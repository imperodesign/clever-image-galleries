'use strict';

// Module dependencies.
const config = require('clever-core').loadConfig();
const mongoose = require('mongoose');
const Gallery = mongoose.model('Gallery');
const async = require('async');
const util = require('../util');

// Show gallery list
  exports.showGalleries = function(GalleriesPackage, req, res, next) {
  let page = Number.parseInt(req.query.page);
  page = Number.isNaN(page) ? 0 : page;
  const skip = page * 10;

  function renderGalleryList(galleries, nGalleries) {
    console.log('Rendering galleries...');
    try {
      res.send(GalleriesPackage.render('admin/gallery/list', {
        packages: GalleriesPackage.getCleverCore().getInstance().exportablePkgList,
        user: req.user,
        galleries: galleries,
        nGalleries: nGalleries,
        activePage: page,
        csrfToken: req.csrfToken()
      }));
    } catch (e) {
      next(e);
    }
  }

  async.parallel([
    function getGalleries(cb){
      Gallery.getGalleries(skip, 10)
        .then(function(galleries) {
          async.each(galleries, function(gallery, done) {
            gallery.loadImagePreview()
              .then(function() {
                done();
              })
              .catch(done);
          }, function(err) {
            if(err) return cb(err);
            cb(null, galleries);
          });
        })
        .catch(util.passNext.bind(null, cb));
    },
    function countGalleries(cb){
      Gallery.countGalleries()
        .then(function(nGalleries) {
          cb(null, nGalleries);
        })
        .catch(util.passNext.bind(null, cb));
    }
  ], function(err, options){
      if(err) return util.passNext.bind(null, next);
      renderGalleryList.apply(null, options);
  });

};

exports.showGallery = function(GalleriesPackage, req, res, next) {
  function render(galleryToShow) {
    res.send(GalleriesPackage.render('admin/gallery/details', {
      packages: GalleriesPackage.getCleverCore().getInstance().exportablePkgList,
      user: req.user,
      galleryToShow: galleryToShow,
      csrfToken: req.csrfToken()
    }));
  }

  Gallery.getGalleryById(req.params.id)
    .then(render)
    .catch(util.passNext.bind(null, next));
};

exports.createGallery = function(GalleriesPackage, req, res, next) {
  res.send(GalleriesPackage.render('admin/gallery/create', {
    packages: GalleriesPackage.getCleverCore().getInstance().exportablePkgList,
    user: req.user,
    csrfToken: req.csrfToken()
  }));
};

exports.editGallery = function(GalleriesPackage, req, res, next) {
  function render(galleryToEdit) {
    res.send(GalleriesPackage.render(`admin/gallery/edit`, {
      packages: GalleriesPackage.getCleverCore().getInstance().exportablePkgList,
      user: req.user,
      galleryToEdit: galleryToEdit,
      csrfToken: req.csrfToken()
    }));
  }

  Gallery.getGalleryById(req.params.id)
    .then(render)
    .catch(util.passNext.bind(null, next));
};
