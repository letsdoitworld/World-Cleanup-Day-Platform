'use strict';
angular.module('ldrWebApp').controller('EditPileCtrl', [
    '$scope',
    '$rootScope',
    'Pile',
    '$state',
    'HelperService',
    'CommentsService',
    'Auth',
    'currentPile',
    'Authority',
    'LxNotificationService',
    'LxDialogService',
    'ImageUpload',
    '$sce',
    'preloader',
    '$translate',
    'responseHandler',
    function ($scope, $rootScope, Pile, $state, HelperService, CommentsService, Auth, currentPile, Authority,
              LxNotificationService, LxDialogService, ImageUpload, $sce, preloader, $translate, responseHandler) {

        $scope.comment = {};
        $scope.pile = new Pile(currentPile);
        $scope.canDelete = true;
        if ($scope.pile.screenshot) {
            $scope.allImages = $scope.pile.images.concat($scope.pile.screenshot);
            $scope.maxSize = 4;
            $scope.minSize = 2;
        } else {
            $scope.allImages = $scope.pile.images;
            $scope.maxSize = 3;
            $scope.minSize = 1;
        }
        $scope.allImages.index = 0;
        $rootScope.truePileLocation = {};
        angular.copy($scope.pile.location, $rootScope.truePileLocation);
        Auth.getCurrentUser().$promise.then(function (data) {
            $scope.user = responseHandler.getData(data);
        });
        $scope.showEditableMarker = false;
        $scope.description = $scope.pile.description;
        $scope.selectedImage = false;
        $scope.saving = false;
        $scope.uploadMaxFileSize = $rootScope.environment.images.max_size;

        $scope.pile_statuses = HelperService.getPileStatuses();

        if ($scope.pile.city && $scope.pile.city._id) {
            Authority.get({city: $scope.pile.city._id}).$promise.then(function (data) {
                $scope.authorities = responseHandler.getData(data);
            });
        }

        CommentsService.query({pile: $state.params.id}).$promise.then(function success(data) {
            $scope.comments = responseHandler.getData(data);
        });

        $scope.confirmStatus = function (what) {
            Pile.confirm({action: what, pile: $scope.pile._id}).$promise.then(function success(data) {
                angular.extend($scope.pile, responseHandler.getData(data));
            });
        };

        $scope.allocate = {
            date: moment().add(parseInt($rootScope.environment.pile.min_reported_days), 'day')
        };

        $scope.allocatePile = function (form) {
            $scope.bgImage = '#FFF url("../assets/images/map/type_description_' + Auth.getCurrentUser().language + '.svg") no-repeat center center';
            if (form.$valid) {
                Pile.allocate({
                    'due_date': $scope.allocate.date.toString(),
                    'authority_id': $scope.allocate.authority._id,
                    'pile_id': $scope.pile._id
                }).$promise
                    .then(function (data) {
                        angular.extend($scope.pile, responseHandler.getData(data));
                        LxNotificationService.success($translate.instant('views.editViewPile.successAllocated'));
                    })
                    .catch(function (err) {
                        if (err.status === 400) {
                            LxNotificationService.warning(err.data);
                        } else {
                            LxNotificationService.warning($translate.instant('generic.serverError'));
                        }
                    });
            }
        };

        $scope.setStatus = function (status) {

            Pile.query({id: $state.params.id}).$promise.then(function (data) {
                if (responseHandler.getData(data).status !== status) {
                    var myPile = angular.copy($scope.pile);
                    myPile.status = status;
                    Pile.update({id: myPile._id}, myPile).$promise.then(function () {
                        $scope.pile = myPile;
                        LxNotificationService.success($translate.instant('views.editViewPile.successChanged') + ' ' +
                            $translate.instant('pile.status.' + status).toUpperCase());
                    });

                } else {
                    LxNotificationService.warning($translate.instant('views.editViewPile.alreadyMessageOne') + ' ' +
                        $translate.instant('pile.status.' + status).toUpperCase() + ' ' +
                        $translate.instant('views.editViewPile.alreadyMessageTwo'));
                }
            });

        };

        $scope.printPile = function () {

            Pile.query({id: $state.params.id}).$promise.then(function (data) {
                var pile = responseHandler.getData(data);
                if (pile && pile.allocated && pile.allocated.file_path) {
                    window.location = pile.allocated.file_path;
                } else {
                    LxNotificationService.warning($translate.instant('views.editViewPile.pdfGenerating') + '...');
                }
            });

        };

        $scope.openMapDialog = function (dialogId) {
            $scope.mapdialog = true;
            LxDialogService.open(dialogId);
            angular.element('.dialog-filter').unbind('click');
            $scope.showEditableMarker = false;
        };

        $scope.closeMapDialog = function (dialogId) {
            $scope.mapdialog = false;
            LxDialogService.close(dialogId);
            angular.copy($rootScope.truePileLocation, $scope.pile.location);
        };

        $scope.closingMapDialog = function () {
            $scope.mapdialog = false;
        };
        $scope.openEditPileLocationDialog = function (dialogId) {
            $scope.editPileLocationDialog = true;
            LxDialogService.open(dialogId);
            angular.element('.dialog-filter').unbind('click');
            $scope.showEditableMarker = true;
        };
        $scope.closeEditPileLocationDialog = function (dialogId) {
            $scope.editPileLocationDialog = false;
            LxDialogService.close(dialogId);
            angular.copy($rootScope.truePileLocation, $scope.pile.location);
        };
        $scope.closingEditPileLocationDialog = function () {
            $scope.editPileLocationDialog = false;
        };
        $scope.openCommentDialog = function (dialogId) {
            LxDialogService.open(dialogId);
        };
        $scope.closeCommentDialog = function (form, dialogId) {
            LxDialogService.close(dialogId);
            form.$setPristine();
            $scope.comment.description = '';
        };
        $scope.closingCommentDialog = function (form) {
            $scope.$eval(form).$setPristine();
            $scope.comment.description = '';
        };

        $scope.openEditDescriptionDialog = function (dialogId) {
            $scope.pile.description = $scope.description;
            LxDialogService.open(dialogId);
        };
        $scope.closeDescriptionDialog = function (form, dialogId) {
            LxDialogService.close(dialogId);
            form.$setPristine();
        };
        $scope.closingDescriptionDialog = function (form) {
            $scope.$eval(form).$setPristine();
        };

        $scope.openModal = function (dialogId) {
            LxDialogService.open(dialogId);
            angular.element('.dialog-filter').unbind('click');
        };

        $scope.closeModal = function (dialogId) {
            LxDialogService.close(dialogId);
            $scope.selectedImage = false;
            $scope.newImage = {};
        };

        $scope.openConfirmationModal = function (dialogID) {
            LxDialogService.open(dialogID);
        };

        $scope.closeConfirmationModal = function (dialogID) {
            LxDialogService.close(dialogID);
        };

        $scope.deleteImage = function (dialogId) {
            ImageUpload.remove($scope.allImages[$scope.allImages.index]._id).then(function () {
                $scope.allImages.splice($scope.allImages.index, 1);
                if ($scope.allImages.index !== 0) {
                    $scope.allImages.index--;
                }
                LxDialogService.close(dialogId);
            });
        };

        $scope.deleteThumb = function () {
            $scope.selectedImage = false;
            $scope.newImage = {};
        };

        $scope.selectImage = function ($files) {
            $scope.selectedImage = false;
            var file = $files[0];
            if ($files.length) {
                $scope.selectedImage = true;
                if ($files.length > 1) {
                    LxNotificationService.warning($translate.instant('views.editViewPile.onlyOnePhoto'))
                }
                ImageUpload.isImage(file).then(
                    function (result) {
                        if (!result) {
                            LxNotificationService.warning($translate.instant('views.editViewPile.onlyPhotos'))
                        } else {
                            if (file.size <= $scope.uploadMaxFileSize) {
                                HelperService.generateThumbnail(file).then(function (imageUrl) {

                                    preloader.preloadImages([imageUrl]).then(function handleResolve() {
                                    }, function handleReject() {
                                    });

                                    file.thumbnailImage = $sce.trustAsResourceUrl(imageUrl);
                                    $scope.newImage = file;

                                });
                            } else {
                                LxNotificationService.warning($translate.instant('views.editViewPile.file') + ' ' +
                                    $files[0].name + ' ' + $translate.instant('views.editViewPile.fileExceeds') +
                                    parseFloat(uploadMaxFileSize / (1024 * 1024)) + 'MB!');
                            }
                        }
                    }
                );
            }
        };

        $scope.saveImage = function (dialogId) {
            $scope.saving = true;
            ImageUpload.upload($scope.newImage, 'pile', $scope.pile._id).then(function success(image) {
                $scope.saving = false;
                LxDialogService.close(dialogId);
                $scope.selectedImage = false;
                $scope.newImage = {};
                if ($scope.allImages[$scope.allImages.length - 1].is_screenshot) {
                    $scope.allImages.splice($scope.allImages.length - 1, 0, image);
                } else {
                    $scope.allImages.push(image);
                }
            });
        };

        $scope.$watch('allImages.index', function () {
            $scope.canDelete = ($scope.allImages[$scope.allImages.index].is_screenshot &&
            $scope.allImages.index === $scope.allImages.length - 1);
        });

        $scope.addComment = function (comment) {
            $scope.comments.unshift(comment);
        };

        $scope.postComment = function (form, dialogId) {
            if (typeof $scope.comment.description === 'undefined') {
                LxNotificationService.info($translate.instant('views.editViewPile.addCommentDialog.commentTenChars'));
            }
            if (form.$valid) {
                CommentsService.create({pile: $state.params.id}, {
                    description: $scope.comment.description
                }).$promise.then(function success(resp_comment) {
                    var comment = responseHandler.getData(resp_comment);
                    $scope.comment.description = '';
                    $scope.addComment(comment);
                    LxNotificationService.success($translate.instant('views.editViewPile.successComment'));
                });
                $scope.closeCommentDialog(form, dialogId);
            }
        };

        $scope.editDescription = function (form, dialogId) {
            if (form.$valid) {
                $scope.description = $scope.pile.description;
                Pile.update({id: $scope.pile._id}, $scope.pile).$promise.then(function () {
                    LxNotificationService.success($translate.instant('views.editViewPile.successAddComment'));
                    LxDialogService.close(dialogId);
                    form.$setPristine();
                });
            }
        }
    }]);
