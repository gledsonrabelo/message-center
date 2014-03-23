'use strict';

// Create a new angular module.
var MessageCenterModule = angular.module('MessageCenterModule', []);

// Define a service to inject.
MessageCenterModule.
    factory("messageCenterService", function ($rootScope) {
        var messageService = {
            mcMessages: this.mcMessages || [],
            status: {
                unseen: 'unseen',
                shown: 'shown',
                /** @var Odds are that you will show a message and right after that
                 * change your route/state. If that happens your message will only be
                 * seen for a fraction of a second. To avoid that use the "next"
                 * status, that will make the message available to the next page */
                next: 'next',
                /** @var Do not delete this message automatically. */
                permanent: 'permanent'
            },
            add: function (type, message, options) {
                var availableTypes = ['info', 'warning', 'danger', 'success'],
                    service = this;
                options = options || {};
                if (availableTypes.indexOf(type) == -1) {
                    throw "Invalid message type";
                }
                this.mcMessages.push({
                    type: type,
                    message: message,
                    status: options.status || this.status.unseen,
                    processed: false,
                    close: function () {
                        return service.remove(this);
                    }
                });
            },
            remove: function (message) {
                var index = this.mcMessages.indexOf(message);
                this.mcMessages.splice(index, 1);
            },
            reset: function () {
                this.mcMessages = [];
            },
            removeShown: function () {
                for (var index = this.mcMessages.length - 1; index >= 0; index--) {
                    if (this.mcMessages[index].status == this.status.shown) {
                        this.remove(this.mcMessages[index]);
                    }
                }
            },
            markShown: function () {
                for (var index = this.mcMessages.length - 1; index >= 0; index--) {
                    if (!this.mcMessages[index].processed) {
                        if (this.mcMessages[index].status == this.status.unseen) {
                            this.mcMessages[index].status = this.status.shown;

                        }
                        else if (this.mcMessages[index].status == this.status.next) {
                            this.mcMessages[index].status = this.status.unseen;
                        }
                        this.mcMessages[index].processed = true;
                    }
                }
            },
            handleNext: function () {
                for (var index = this.mcMessages.length - 1; index >= 0; index--) {
                    if (this.mcMessages[index].processed) {
                        if (this.mcMessages[index].status == this.status.unseen) {
                            this.mcMessages[index].processed = false;
                        }
                    }
                }
            }
        };

        $rootScope.$on('$locationChangeStart', function () {

            messageService.markShown();
            messageService.removeShown();
            messageService.handleNext();
        });

        return messageService;
    }
);
MessageCenterModule.
    directive('mcMessages', ['$rootScope', 'messageCenterService', function ($rootScope, messageCenterService) {
        return {
            restrict: 'EA',
            template: '\
      <div id="mc-messages-wrapper">\
        <div class="alert alert-{{ message.type }} fade in" ng-repeat="message in mcMessages">\
          <a class="close" ng-click="message.close();" data-dismiss="alert" aria-hidden="true">&times;</a>\
          {{ message.message }}\
        </div>\
      </div>\
      ',
            link: function (scope, element, attrs) {

                $rootScope.mcMessages = messageCenterService.mcMessages;

            }
        };
    }]);
