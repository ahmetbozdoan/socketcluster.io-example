var serviceQrSocketModule = angular.module('vitamin.service.qrSocketService', []);

serviceQrSocketModule.factory('serviceQrSocket', [
  '$rootScope',
  '$translate',
  '$timeout',
  'utilArray',
  'utilData',
  'utilViewMessageBox',
  'uiToastr',
  'uiWindow',
  'userProfile',
  'userPermission',
  'utilSystemServer',
  'uiMobile',
  function ($rootScope, $translate, $timeout, utilArray, utilData, utilViewMessageBox, uiToastr, uiWindow, userProfile, userPermission, utilSystemServer, uiMobile) {
    var qrSocketData = {
      data: {},
      channels: {
        private: ""
      },
      event: {
        name: ""
      }
    };
    var qrSocketClient;

    $rootScope.$on(vitamin.system.appBridge.QR_SOCKET_WEB_CONTROL, function (e, qrId) {
      if (userProfile.isEbaUser() || !userPermission.checkPermission(vitamin.user.permission.ROLE_VITAMIN_BOOK) || !uiMobile.isMobile()) {
        $rootScope.$broadcast(
            vitamin.system.qrCode.OPEN_QRCODE,
            qrId
        );
        return false
      };

      try {
        //QR okuttuktan sonra web tarafında soket bağlı olup olmadığı kontrol edilir.
        qrSocketData.channels.private = 'mobil_' + userProfile.getUserId();
        var privateChannel = qrSocketClient.subscribe(qrSocketData.channels.private);

        var isWebQRSocketConnect = false;
        qrSocketData.event.name = "checkSocket";
        qrSocketData.channels.private = 'web_' + userProfile.getUserId();

        //WEB'e soket kontrol mesaji gonderilir.
        qrSocketClient.transmit('QRSocket', qrSocketData);

        (async () => {
          for await (let message of privateChannel) {
            if (message.data.event.name == 'socketConnected') {
              //Web'den soket bağlı mesajı geldi.
              isWebQRSocketConnect = true;

              var btns = [
                { result: 'no', label: 'LABEL_BUTTON_OPEN_MOBIL', cssClass: 'btn btn-default' },
                { result: 'yes', label: 'LABEL_BUTTON_OPEN_WEB', cssClass: 'btn btn-info' }
              ];
              utilViewMessageBox.show('INFORM_MESSAGE_ATTENTION',  "INFORM_QR_SOCKET_OPEN_CONTENT_ON_WEB", vitamin.util.view.messageBox.TYPE_INFO, btns)
                .then(function (result) {
                  switch (result) {
                    case "yes":
                      //Webden açılması için web sokete mesaj gönder.
                      qrSocketData.event.name = "QRCode";
                      qrSocketData.channels.private = 'web_' + userProfile.getUserId();
                      qrSocketData.data.qrcode = qrId;

                      qrSocketClient.transmit('QRSocket', qrSocketData);
                      break;
                    case "no":
                      //Mobilden devam et.
                      $rootScope.$broadcast(
                        vitamin.system.qrCode.OPEN_QRCODE,
                        qrId
                      );
                      break;
                  }
                });
            }
          }
        })();

        uiWindow.showPreloader();
        $timeout(function () {
          uiWindow.hidePreloader();
          if (!isWebQRSocketConnect){
            //Beklenen sürede web soketten cevap gelmezse mobilden devam eder.
            qrSocketClient.unsubscribe(qrSocketData.channels.private);

            $rootScope.$broadcast(
              vitamin.system.qrCode.OPEN_QRCODE,
              qrId
            );
          }
        }, 500)
      } catch (e) {
        //Herhangi bir js kod hatasında içerik mobilden açılır.
        $rootScope.$broadcast(
          vitamin.system.qrCode.OPEN_QRCODE,
          qrId
        );
      }
    });

    function _privateRunQRSocketConnection() {
      if (userProfile.isEbaUser() || !userPermission.checkPermission(vitamin.user.permission.ROLE_VITAMIN_BOOK)) return false;

      try {
        // qrSocketClient = socketClusterClient.create({
        //   hostname: utilSystemServer.getVclassSocketUrl(),
        //   path: '/socketcluster/',
        //   secure: true,
        //   port: 443
        // });

        if (!uiMobile.isMobile()){
          // (async () => {
          //   //Web kendine özel kanalını dinlemeye başlar.
          //   qrSocketData.channels.private = 'web_' + userProfile.getUserId();
          //   var privateChannel = qrSocketClient.subscribe(qrSocketData.channels.private);
          //   console.log('subscribe:private:' + qrSocketData.channels.private, privateChannel.state);
          //
          //   for await (let message of privateChannel) {
          //     console.log("message:private:", message)
          //
          //     if (message.data.event.name == 'checkSocket') {
          //       //Mobilden gelen soket kontrol mesajına, soket bağlı mesajı gönderildi..
          //       qrSocketData.event.name = "socketConnected";
          //       qrSocketData.channels.private = 'mobil_' + userProfile.getUserId();
          //       qrSocketClient.transmit('QRSocket', qrSocketData);
          //
          //       console.log("BİLGİ", "Mobil'e soket bağlı mesajı gönderildi.");
          //     } else if (message.data.event.name == 'QRCode') {
          //       //Mobilden webde açılması için qr kod geldi. İçerik açılması tetiklenir.
          //       uiToastr.show(vitamin.ui.toastr.TYPE_SUCCESS, $translate.instant('TOASTR_QR_OPEN_WEB'), '');
          //       $rootScope.$broadcast(
          //         vitamin.system.qrCode.OPEN_QRCODE,
          //         message.data.data.qrcode
          //       );
          //
          //       console.log("BİLGİ: İçerik açılıyor...", message.data.data.qrcode);
          //     }
          //   }
          // })();
        }

        // var options = {
        //   hostname: utilSystemServer.getVclassSocketUrl(),
        //   path: '/socketcluster/',
        //   secure: true,
        //   port: 443,
        //   rejectUnauthorized: true // Only necessary during debug if using a self-signed certificate
        // };
        var options = {
          hostname: 'localhost',
          port: 8000
        };
// Initiate the connection to the server
        var socket = socketCluster.create(options);


        socket.on('subscribe', function(channelname) {
          console.log('subscribe:' + channelname);
        });

        socket.on('QRSocket', function(channelname) {
          console.log('subscribe:' + channelname);
        });

        socket.on('web_fdb64c50abfd41b0a3d48fef7fa1d768', function(channelname) {
          console.log('subscribe:' + channelname);
        });

        socket.on('subscribeFail', function(channelname) {
          console.log('subscribeFail:' + channelname);
        });

        socket.on('unsubscribe', function(channelname) {
          console.log('unsubscribe:' + channelname);
        });

        socket.on('subscribeStateChange', function(data) {
          console.log('subscribeStateChange:' + JSON.stringify(data));
        });

        socket.on('message', function(data) {
          console.log('message:', data);
        });

        var privateChannel = socket.subscribe('web_' + userProfile.getUserId());

        privateChannel.watch(function (message) {
          if (message.data.event.name == 'checkSocket') {
            //Mobilden gelen soket kontrol mesajına, soket bağlı mesajı gönderildi..
            qrSocketData.event.name = "socketConnected";
            qrSocketData.channels.private = 'mobil_' + userProfile.getUserId();
            // qrSocketClient.transmit('QRSocket', qrSocketData);
            socket.publish('mobil_' + userProfile.getUserId(), qrSocketData);

            console.log("BİLGİ", "Mobil'e soket bağlı mesajı gönderildi.");
          } else if (message.data.event.name == 'QRCode') {
            //Mobilden webde açılması için qr kod geldi. İçerik açılması tetiklenir.
            uiToastr.show(vitamin.ui.toastr.TYPE_SUCCESS, $translate.instant('TOASTR_QR_OPEN_WEB'), '');
            $rootScope.$broadcast(
              vitamin.system.qrCode.OPEN_QRCODE,
              message.data.data.qrcode
            );

            console.log("BİLGİ: İçerik açılıyor...", message.data.data.qrcode);
          }
        });

      }
      catch(err) {
        console.error("ERROR socketClusterClient: ", err)
      }
    }


    var serviceQrSocket = {
      privateRunQRSocketConnection: function () {
        return _privateRunQRSocketConnection();
      }
    };
    return serviceQrSocket;
  }]);
