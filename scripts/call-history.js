var SipLogs = $('#sip-logitems')
function ajaxCalls() {
    $.ajax({
        url: `https://172.16.21.142/reportes/ultimas_llamadas_agente/${name}`,
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
                //status Exten: 0=Idle,1=inUse,2=busy,4=unavailable,8=Ringing,9=inUse&Ringing,16=Hold,17=inUse&Hold
                // if (status == 0) {
                //     status = 'Disponible';
                //     dotColor = 'green'
                // } else if (status == 1) {
                //     status = 'En Uso';
                //     dotColor = 'green'
                // } else if (status == 2) {
                //     status = 'Ocupado';
                //     dotColor = 'red'
                // } else if (status == 4) {
                //     status = 'Teléfono Desconectado';
                //     dotColor = 'gray'
                // } else if (status == 8) {
                //     status = 'Ringing';
                //     dotColor = 'red'
                // } else if (status == 9) {
                //     status = 'InUse&Ringing';
                //     dotColor = 'red'
                // } else if (status == 16) {
                //     status = 'En Espera';
                //     dotColor = 'red'
                // } else if (status == 17) {
                //     status = 'InUse&Hold';
                //     dotColor = 'red'
                // }
                // set queues with data['agent_list'][i]['queues'] only queue_names
                var duration = data['last_calls'][i]['data2'];
                var queuename = data['last_calls'][i]['queuename'];
                // var interface = data['agent_list'][i]['interface'];
                // var dotColor = status === 'Disponible' ? 'green' : 'red';

                // coaching is a two buttons <i class="fa-solid fa-user-secret"></i>
                // change status is a select with {{Estados}}

                // var desconectar =
                //     '<button class="btn btn-danger btn-sm" onclick="coaching(' + "'" + agent + "','" +
                //     interface + "'" +
                //     ',3)" ><i class="fas fa-phone-slash fa-lg"></i> Desconectar</button>';
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

            //change color only second column
            // $('#tabla_base_2 tr:contains("")').find('td:eq(1)').css(
            //     'background-color', '#AF7AC5').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("InUse&Ringing")').find('td:eq(1)').css(
            //     'background-color', '#2980B9').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("InUse&Hold")').find('td:eq(1)').css(
            //     'background-color', '#CA6F1E').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("Ringing")').find('td:eq(1)').css(
            //     'background-color', '#2980B9').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("En Uso")').find('td:eq(1)').css(
            //     'background-color', '#CA6F1E').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("Ocupado")').find('td:eq(1)').css(
            //     'background-color', '#CA6F1E').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("Disponible")').find('td:eq(1)').css(
            //     'background-color', '#28B463').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("Teléfono Desconectado")').find('td:eq(1)').css(
            //     'background-color', '#85929E').css('color', '#ffffff').css('font-weight',
            //         'bold');
            // $('#tabla_base_2 tr:contains("En Espera")').find('td:eq(1)').css(
            //     'background-color', '#CA6F1E').css('color', '#ffffff').css('font-weight',
            //         'bold');

        }
    });
}
// setInterval(ajaxAgentes, 10000);
$(document).ready(function () {
  setTimeout(() => {
      setInterval(ajaxCalls, 5000);
  }, 10000);
});