var SipLogs = $('#sip-logitems')
function ajaxCalls() {
    $.ajax({
        url: `https://${host}/reportes/ultimas_llamadas_agente/${name}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);
            // tabla_agentes.clear().draw();
            var dotColor = '';
            SipLogs.empty();
            for (var i = 0; i < data['last_calls'].length; i++) {
                var phone = data['last_calls'][i]['phone'];
                var time = data['last_calls'][i]['time'];
                var duration = data['last_calls'][i]['data2'];
                var queuename = data['last_calls'][i]['queuename'];
                var innerHtml = `<div class="hover:bg-gray-200 cursor-pointer bg-white border-b-[1px] flex p-3 items-center row-table-log">
                    <div class="w-2/3">
                      <div class="flex items-center">
                        <i class="fa fa-phone-square text-3xl ml-2 mb-6"></i>
                        <div class="ml-2">
                          <span class="capitalize block text-gray-800 text-2xl">${phone}</span>
                          <span class="block text-gray-600 text-xl">${time}</span>
                        </div>
                      </div>
                    </div>
                    <div class="w-1/3 h-12 flex justify-center flex-col items-end">
                        <span class="capitalize text-gray-600 text-xl">${duration}</span>
                        <span class="capitalize text-gray-600 text-xl">${queuename}</span>
                    </div>
                  </div> `
                SipLogs.append(innerHtml);
            }
        }
    });
}