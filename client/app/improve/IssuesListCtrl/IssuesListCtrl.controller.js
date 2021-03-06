'use strict';

angular.module('ldrWebApp')
    .controller('IssuesListCtrl', [
        '$scope',
        'Issues',
        'LxDialogService',
        'LxNotificationService',
        '$translate',
        'responseHandler',
        function ($scope, Issues, LxDialogService, LxNotificationService, $translate, responseHandler) {

            var today = new Date();
            $scope.range = {
                date_start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                date_end: today,
                email: ''
            };

            $scope.endDateLimit = moment().add(1, 'day').startOf('day').toDate();

            $scope.pagination = {
                page: 1,
                limit: 7,
                total: 0,
                skip: 7
            };

            $scope.prev = function () {
                $scope.pagination.page--;
            };
            $scope.next = function () {
                $scope.pagination.page++;
            };

            $scope.$watchGroup(['pagination.page', 'range.date_start', 'range.date_end'], function () {
                Issues.query({
                    page: $scope.pagination.page,
                    limit: $scope.pagination.limit,
                    date_start: $scope.range.date_start,
                    date_end: $scope.range.date_end
                }, function (data, headers) {
                    $scope.issues = responseHandler.getData(data);
                    var headers = headers();
                    $scope.pagination.total = headers['x-total-count'];
                    $scope.totalNumberPages = Math.ceil($scope.pagination.total / $scope.pagination.skip);
                });
            });

            $scope.opendIssueVIew = function (dialogId, object) {
                LxDialogService.open(dialogId);
                $scope.viewPile = object;
            };

            $scope.closingDialog = function (dialogId) {
                $scope.viewPile = null;
                LxDialogService.close(dialogId);
                LxNotificationService.success($translate.instant('generic.closeDialog'));
            };

            $scope.closeDialog = function (dialogId, form) {
                LxDialogService.close(dialogId);
                form.$setPristine();
            };
            $scope.openDialog = function (dialogId) {
                $scope.range.email = '';
                LxDialogService.open(dialogId);
            };

            $scope.sendErrors = function (form, dialogId) {

                if (form.$valid) {

                    Issues.query({
                        date_start: $scope.range.date_start,
                        date_end: $scope.range.date_end,
                        mail_to: $scope.range.email
                    }, function () {
                        $scope.closeDialog(dialogId, form);
                        LxNotificationService.success($translate.instant('views.improve.successSent'));
                    });

                }

            };

            $scope.filterByRange = function () {

            };

        }]);
