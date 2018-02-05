$(function () {
    /* initialize the calendar
     -----------------------------------------------------------------*/
    //Date for the calendar events (dummy data)
    var GroupId=$('#Schule_Group_Id').val();
    var date = new Date();
    var d = date.getDate(),
        m = date.getMonth(),
        y = date.getFullYear();
    $('#calendar-place').fullCalendar({

        lang: 'de',
        defaultView:'agendaWeek',
        allDaySlot:false,
        height: 'auto',
        minTime: "01:00:00",
        maxTime: "10:00:00",
        axisFormat:'U h(:mm)',
        displayEventTime: false,
        slotDuration:'01:00:00',
        selectable:true,
        selectConstraint:'businessHours',
        customButtons: {
            myCustomButton: {
                text: 'wieder neu einspielen Feirtage',
                    click: function() {
                        $.ajax({
                            url: Routing.generate('fullcalendar_feirtage'),
                            data: { Groupid:GroupId},
                            type: 'POST',
                            dataType: 'json',
                            beforeSend: function () {
                                $('#pleaseWaitDialog').modal('show');
                            },
                            complete: function () {
                                $('#pleaseWaitDialog').modal('hide');
                            },
                            success: function (response) {
                               console.log(response.msg);
                            },
                            error: function (response) {
                               alert('fehler');
                            }
                        });
                }
            }
        },
        header: {
            left: 'prev,next today myCustomButton',
            center: 'title',
            right: 'agendaWeek,agendaDay,month '
        },
        businessHours: {
            // days of week. an array of zero-based day of week integers (0=Sunday)
            dow: [ 1, 2, 3, 4, 5 ], // Monday - Thursday

            start: '01:00', // a start time (10am in this example)
            end: '10:00', // an end time (6pm in this example)
        },
        eventConstraint:"businessHours",
        events:
        {

            url:Routing.generate('fullcalendar_loadevents', { month: moment().format('MM'), year: moment().format('YYYY'),gruppeId:GroupId }),
            color: 'blue',
            textColor:'white',
            error: function() {
                alert('Error receving events');
            }

        },
        viewRender: function (view, element) {
            var month = view.calendar.getDate().format('MM');
            var year = view.calendar.getDate().format('YYYY');

        },

        eventDrop: function(event,delta,revertFunc) {
            var newStartData = event.start.format('YYYY-MM-DD HH:mm:ss');
            var newEndData = (event.end == null) ? newStartData : event.end.format('YYYY-MM-DD HH:mm:ss');
            $.ajax({
                url: Routing.generate('fullcalendar_getdozentevent'),//get the dozent id and the type of the event
                data: { id: event.id },
                type: 'POST',
                dataType: 'json',
                success: function(response){


                    $.ajax({

                        url: Routing.generate('fullcalendar_checkevent'),
                        data: { startevent: newStartData,endevent: newEndData, dozent:response.id ,id:event.id, eventtype:response.eventtypeid },
                        type: 'POST',
                        dataType: 'json',
                        success: function(response){
                            var event_date = moment(newStartData).format('YYYY-MM-DD');
                            $.ajax({
                                url: Routing.generate('fullcalendar_changedate'),
                                data: { id: event.id, newStartData: newStartData,newEndData:newEndData,event_date:event_date },
                                type: 'POST',
                                dataType: 'json',
                                success: function(response){
                                    console.log('Done');
                                },
                                error: function(e){
                                    revertFunc();
                                    alert('Error processing your request: '+e.responseText);
                                }
                            });



                        },
                        error: function(e){

                            if (e.status==400){

                                $('#calendar-place').fullCalendar( 'refetchEvents');

                                BootstrapDialog.show({
                                    title: 'Vorsicht!',
                                    type: BootstrapDialog.TYPE_DANGER,
                                    message: e.responseText,
                                    buttons: [{
                                        id:'close',
                                        label: 'schließen',
                                        action: function(dialog) {
                                            dialog.close();
                                        }
                                    }]
                                });
                            }

                            else {

                                alert('Error processing your request: '+e.responseText);

                            }


                        }
                    });





                    /*end dozent get event*/
                },
                error: function(e){
                    revertFunc();
                    alert('Error processing your request: '+e.responseText);
                }
            });









        },
        eventResize: function(event, delta, revertFunc) {
            var newStartData = event.start.format('YYYY-MM-DD HH:mm:ss');
            var newEndData = (event.end == null) ? newStartData : event.end.format('YYYY-MM-DD HH:mm:ss');



            $.ajax({
                url: Routing.generate('fullcalendar_getdozentevent'),
                data: { id: event.id },
                type: 'POST',
                dataType: 'json',
                success: function(response){
                    $.ajax({

                        url: Routing.generate('fullcalendar_checkevent'),
                        data: { startevent: newStartData,endevent: newEndData, dozent:response.id ,id:event.id, eventtype:response.eventtypeid},
                        type: 'POST',
                        dataType: 'json',
                        success: function(response){
                            var event_date = moment(newStartData).format('YYYY-MM-DD');
                            $.ajax({
                                url: Routing.generate('fullcalendar_changedate'),
                                data: { id: event.id, newStartData: newStartData,newEndData:newEndData,event_date:event_date },
                                type: 'POST',
                                dataType: 'json',
                                success: function(response){
                                    console.log('resize Done');
                                },
                                error: function(e){
                                    revertFunc();
                                    alert('Error processing your request: '+e.responseText);
                                }
                            });



                        },
                        error: function(e){

                            if (e.status==400){

                                $('#calendar-place').fullCalendar( 'refetchEvents');

                                BootstrapDialog.show({
                                    title: 'Vorsicht!',
                                    type: BootstrapDialog.TYPE_DANGER,
                                    message: e.responseText,
                                    buttons: [{
                                        id:'close',
                                        label: 'schließen',
                                        action: function(dialog) {
                                            dialog.close();
                                        }
                                    }]
                                });
                            }

                            else {

                                alert('Error processing your request: '+e.responseText);

                            }


                        }
                    });





                    /*end dozent get event*/
                },
                error: function(e){
                    revertFunc();
                    alert('Error processing your request: '+e.responseText);
                }
            });









        },
        eventClick: function(calEvent, jsEvent, view , revertFunc) {


            BootstrapDialog.show({
                title: 'Löschen!',
                type: BootstrapDialog.TYPE_DANGER,
                message: 'Sind Sie Sicher ,Wollen Sie diese Unterricht löschen!',
                buttons: [{
                    id:'del',
                    label: 'löschen',
                    action: function(dialog) {
                        dialog.close();
                        dialog.getButton('del').disable();
                        dialog.getButton('close').disable();
                        $.ajax({
                            url: Routing.generate('fullcalendar_delevent'),
                            data: { id: calEvent.id },
                            type: 'POST',
                            dataType: 'json',
                            success: function(response){
                                console.log('ok');
                                $('#calendar-place').fullCalendar( 'removeEvents', calEvent.id );
                                dialog.close();
                            },
                            error: function(e){
                                revertFunc();
                                alert('Error processing your request: '+e.responseText);
                            }
                        });
                    }
                }, {
                    id:'close',
                    label: 'schließen',
                    action: function(dialog) {
                        dialog.close();
                    }
                }]
            });


        },
        select: function(start, end, jsEvent, view) {


            var starttime = moment(start).format('YYYY-MM-DD HH:mm:ss');
            var endtime = moment(end).format('YYYY-MM-DD HH:mm:ss');
            $('#start').val(starttime);//store the value of the selection start date in hidden field
            $('#end').val(endtime);// store the value of the selection end date in hidden field
            // i did that to get the real selected startdate and enddate .
            $('#exampleModal').modal('show');

            ///add praktikum
            $('#praktikum').click(function (e) {
                e.preventDefault();
                me=$(this);
                if ( me.data('requestRunning') ) {
                    return;
                }
                me.data('requestRunning', true);

                $('#exampleModal').modal('hide');

                var eventLabel='Praktikum';
                var starttime = $('#start').val();
                var endtime = $('#end').val();
                var event_date = moment(starttime).format('YYYY-MM-DD');

                $.ajax({
                    url: Routing.generate('fullcalendar_addevent'),
                    data: { start: starttime,end: endtime ,title:eventLabel,group:GroupId,event_date:event_date,eventtype:1 },
                    type: 'POST',
                    dataType: 'json',
                    success: function(response){

                        console.log(response.event);
                        $('#calendar-place').fullCalendar( 'renderEvent', response.event );
                        $('#exampleModal').modal('hide');
                        $('#addevent').bootstrapValidator('resetForm', true);



                    },
                    complete: function() {
                        me.data('requestRunning', false);
                    },
                    error: function(e){
                        alert('Error processing your request: '+e.responseText);
                    }
                });


            }); /// end Urlaub section to add it



            $('#urlaub').click(function (e) {
                e.preventDefault();
                me=$(this);
                if ( me.data('requestRunning') ) {
                    return;
                }
                me.data('requestRunning', true);
                $('#exampleModal').modal('hide');
                var eventLabel='Urlaub';
                var starttime = $('#start').val();
                var endtime = $('#end').val();
                var event_date = moment(starttime).format('YYYY-MM-DD');

                $.ajax({
                    url: Routing.generate('fullcalendar_addevent'),
                    data: { start: starttime,end: endtime ,title:eventLabel,group:GroupId,event_date:event_date,eventtype:2 },
                    type: 'POST',
                    dataType: 'json',
                    success: function(response){

                        console.log(response.event);
                        $('#calendar-place').fullCalendar( 'renderEvent', response.event );
                        $('#exampleModal').modal('hide');
                        $('#addevent').bootstrapValidator('resetForm', true);

                    },
                    complete: function() {
                        me.data('requestRunning', false);
                    },
                    error: function(e){
                        alert('Error processing your request: '+e.responseText);

                    }
                });


            }); /// end Urlaub section to add it



            $("#addevent").bootstrapValidator({

                fields: {

                'add_event_form[EinzelFach]': {
                    validators: {
                        notEmpty: {
                            message: 'Bitte einen gültigen Wert eingeben'
                        }
                    }
                },
                'add_event_form[Dozent]': {
                    validators: {
                        notEmpty: {
                            message: 'Bitte einen gültigen Wert eingeben'
                        }
                    }
                }
            },

                submitHandler: function (validator, form, submitButton) {

                    $('#exampleModal').modal('hide');
                    var data = $('#addevent').serializeArray();
                    var Einzehl=data[0]['value'];
                    var Dozent= data[1]['value'];
                    var eventLabel =$("#add_event_form_Dozent option:selected").text()+'  -  '+$("#einfach option:selected").text();
                    var starttime = $('#start').val();
                    var endtime = $('#end').val();

                    $.ajax({

                        url: Routing.generate('fullcalendar_checkevent'),
                        data: { startevent: starttime,endevent: endtime, dozent:Dozent ,id:-1, eventtype:4},//id=-1 means that is new event and it isnot in the DB
                        type: 'POST',
                        dataType: 'json',
                        success: function(response){
                            $('#exampleModal').modal('hide');
                            $('#addevent').bootstrapValidator('resetForm', true);
                            $('#addevent').trigger("reset");
                            var event_date = moment(starttime).format('YYYY-MM-DD');

                           $.ajax({
                                url: Routing.generate('fullcalendar_addevent'),
                                data: { start: starttime,end: endtime ,title:eventLabel,einzehl:Einzehl,dozent:Dozent,group:GroupId,event_date:event_date,eventtype:4 },
                                type: 'POST',
                                dataType: 'json',
                                success: function(response){

                                    console.log(response.event);
                                    $('#calendar-place').fullCalendar( 'renderEvent', response.event );
                                    $('#exampleModal').modal('hide');
                                    $('#addevent').bootstrapValidator('resetForm', true);

                                },
                                error: function(e){
                                    alert('Error processing your request: '+e.responseText);
                                }
                            });


                        },
                        error: function(e){

                            if (e.status==400){
                                $('#exampleModal').modal('hide');
                                $('#addevent').bootstrapValidator('resetForm', true);
                                BootstrapDialog.show({
                                    title: 'Löschen!',
                                    type: BootstrapDialog.TYPE_DANGER,
                                    message: e.responseText,
                                    buttons: [{
                                        id:'close',
                                        label: 'schließen',
                                        action: function(dialog) {
                                            dialog.close();
                                        }
                                    }]
                                });
                            }

                            else {

                                alert('Error processing your request: '+e.responseText);

                            }


                        }
                    });



                }


            });

        },

        editable: true,
        unselectAuto:true

    });
});