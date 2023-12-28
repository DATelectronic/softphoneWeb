var SipAnexs = $('#sip-anexs')
function ajaxAgentes() {
    $.ajax({
        url: `https://${host}/reportes/tiempo_real_softphone/1`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);
            // tabla_agentes.clear().draw();
            var dotColor = '';
            SipAnexs.empty();
            for (var i = 0; i < data['agent_list'].length; i++) {
                var agent = data['agent_list'][i]['membername'];
                var status = data['agent_list'][i]['status'];
                //status Exten: 0=Idle,1=inUse,2=busy,4=unavailable,8=Ringing,9=inUse&Ringing,16=Hold,17=inUse&Hold
                if (status == 0) {
                    // status = 'Disponible';
                    dotColor = 'green'
                } else if (status == 1) {
                    // status = 'En Uso';
                    dotColor = 'green'
                } else if (status == 2 || status == 'HABLANDO') {
                    // status = 'Ocupado';
                    dotColor = 'red'
                } else if (status == 4) {
                    status = 'Teléfono Desconectado';
                    dotColor = 'gray'
                } else if (status == 8) {
                    // status = 'Ringing';
                    dotColor = 'red'
                } else if (status == 9) {
                    // status = 'InUse&Ringing';
                    dotColor = 'red'
                } else if (status == 16) {
                    // status = 'En Espera';
                    dotColor = 'red'
                } else if (status == 17) {
                    // status = 'InUse&Hold';
                    dotColor = 'red'
                }
                // set queues with data['agent_list'][i]['queues'] only queue_names
                var queues = data['agent_list'][i]['queues'].map(function (e) {
                    return e.queue_name;
                });
                var time = data['agent_list'][i]['time'];
                var interface = data['agent_list'][i]['interface'];
                var innerHtml = `<div class="hover:bg-gray-200 cursor-pointer bg-white border-b-[1px] flex p-3 items-center row-table-log" anex="${interface}">
                    <span class="text-${dotColor}-500 ml-2 pb-6" style="font-size: 3rem">&#8226;</span>
                    <div class="w-1/2">
                      <div class="flex items-center">
                        <img :src="contact.picture.thumbnail" class="rounded-full">
                        <div class="ml-4">
                          <span class="capitalize block text-gray-800 text-2xl">${agent}</span>
                          <span class="block text-gray-600 text-xl">${queues}</span>
                        </div>
                      </div>
                    </div>
                    <div class="w-1/2 h-12 flex justify-end">
                        <span class="capitalize text-gray-600 text-xl">${interface}</span>
                    </div>
                  </div> `
                SipAnexs.append(innerHtml);
            }
        }
    });
}
