
// Webcam in first tab
Webcam.set({
    image_format: 'png'
});
Webcam.attach( '#my_camera' );
function send_screenshot() {
    Webcam.snap( function(data_uri) {
        var raw_image_data = data_uri.replace(/^data\:image\/\w+\;base64\,/, '');
        document.getElementById('screenshot_data').value = raw_image_data;
        // document.getElementById('screenshot_form').submit();
        document.getElementById('face-container').innerHTML = '<img src="'+data_uri+'"/>';
    } );
}


// Webcam in modal window
Webcam.set({
    image_format: 'png'
});
Webcam.attach( '#profile_camera' );

function snap_screenshot() {
    Webcam.snap( function(data_uri) {
        document.getElementById('profile_face-container').innerHTML = '<img src="'+data_uri+'"/>';
        var raw_image_data = data_uri.replace(/^data\:image\/\w+\;base64\,/, '');
        localStorage.setItem('currentSnap', raw_image_data);
    });
}



// Modal inside modal
$('#modalPhotoBig').on('show.bs.modal', function (e) {
    $('#modalAddUser').css('opacity', 0.5);
    // add src to image inside modal window
    var button = $(e.relatedTarget).closest('button');
    var time = button.data('time');
    console.log( time)
    if (localStorage.getItem('savedImages')){
        var storedArrImages = JSON.parse(localStorage.getItem('savedImages'));
        var requiredImage = storedArrImages.filter(function(item, i){
            return (time == item.moment)
        });
        var requiredSrc = requiredImage[0].image;
    }
    var modal = $(this);
    modal.find('.modal-title').text(time);

    var isImage = (/\.(gif|jpg|jpeg|tiff|png)$/i).test(requiredSrc)
    if (isImage){
        modal.find('.modal-face-container img').attr('src', requiredSrc).attr('alt', time);
    } else {
        modal.find('.modal-face-container img').attr('src', 'data:image/png;base64,'+requiredSrc).attr('alt', time);
    }

});
$('#modalPhotoBig').on('hidden.bs.modal', function () {
    $('#modalAddUser').css('opacity', 1);
    $('body').addClass('modal-open')
});




$('#modalAddUser').on('show.bs.modal', function (e) {
    var button = $(e.relatedTarget).closest('button');
    var name = button.data('name')
    if (name) {
        $('#profileName').val(name)
    } else {
        $('#profileName').val('')
    }
    var lastName = button.data('lastname')
    if (lastName) {
        $('#profileLastName').val(lastName)
    } else {
        $('#profileLastName').val('')
    }

    var id = button.data('id');
    $(this).find('.js-patch').attr('data-id', id);
    if (id){
        $('.submit-container').hide()
        $('.edit-container').show()
    } else {
        $('.submit-container').show()
        $('.edit-container').hide()
    }

    var images = button.data('images')
    if (images){
        localStorage.setItem('savedImages', JSON.stringify(images));

        // render images table
        if (localStorage.getItem('savedImages')){
            renderImagesTable( JSON.parse(localStorage.getItem('savedImages')), $('#table-photo tbody') )
        }
    }
});

$('#modalAddUser').on('hidden.bs.modal', function () {
    localStorage.removeItem('currentSnap');
    localStorage.removeItem('savedImages');
    $('#profile_face-container').html('You should snap first');
    $('#table-photo tbody').empty();
    $(this).find('.js-submit').show();
    $(this).find('.notification-submit-success').hide();
    $(this).find('.js-patch').show();
    $(this).find('.notification-patch-success').hide();
    $(this).find('.notification-no-photo').hide();
    $(this).find('.notification-maximum-photos').hide();
});


// save current snapshot + add table row
$('#save_photo').click(function(e) {

    if ( localStorage.getItem('currentSnap')){
        var moment = new Date();
        var id = moment.getTime();
        var image = localStorage.getItem('currentSnap');

        var imageItem = {
            id: id,
            moment: moment,
            image: image
        };
        // write to localStorage
        if (localStorage.getItem('savedImages')){
            var storedArrImages = JSON.parse(localStorage.getItem('savedImages'));
            // limit number of photos
            if (storedArrImages.length < 10){
                $(this).closest('form').find('.notification-maximum-photos').hide();
                // check the last image - not to send the same snap mutiple times
                if ( storedArrImages[storedArrImages.length-1].image != localStorage.getItem('currentSnap')   ){
                    storedArrImages.push(imageItem);
                    localStorage.setItem('savedImages', JSON.stringify(storedArrImages));
                }
            } else {
                $(this).closest('form').find('.notification-maximum-photos').show();
            }
        } else {
            var arrImages = [];
            arrImages.push(imageItem);
            localStorage.setItem('savedImages', JSON.stringify(arrImages));
        }

        // render images table
        if (localStorage.getItem('savedImages')){
            renderImagesTable( JSON.parse(localStorage.getItem('savedImages')), $('#table-photo tbody') )
        }
    }

});



function renderImagesTable(arr, el){
    el.empty();
    arr.forEach(function(item, i){
        var timeNumber = new Date(item.moment).getTime();
        var markup =
            '<tr>'+
            '<td>№'+(i+1)+'</td>'+
            '<td>id '+ timeNumber +'</td>'+
            '<td>'+ item.moment +'</td>'+
            '<td>'+
            '<button type="button" class="btn btn-link btn-lg py-0 text-dark js-big" data-toggle="modal" data-time='+item.moment+' data-target="#modalPhotoBig"><i class="fa fa-eye" aria-hidden="true"></i></button>'+
            '</td>'+
            '<td>'+
            '<button type="button" class="btn btn-link btn-lg py-0 text-dark js-delete"><i class="fa fa-trash-o" aria-hidden="true"></i></button>'+
            '</td>'+
            '</tr>';
        el.append(markup);
    })
}


function renderUsersTable(arr, el){
    el.empty();
    arr.forEach(function(user, i){
        var images = JSON.stringify(user.images);
        var name = user.name ? 'data-name='+user.name : '';
        var lastName = user.lastName ? 'data-lastname='+user.lastName : '';
        var markup =
            '<tr>'+
            '<td>№'+(i+1)+' '+user.name+' '+user.lastName+'</td>'+
            '<td>'+ user.id +'</td>'+
            '<td>'+
            '<button type="button" class="btn btn-link btn-lg py-0 text-dark js-edit" data-toggle="modal" '+name+' '+lastName+' data-id='+user.id+' data-images='+images+' data-target="#modalAddUser"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>'+
            '<button type="button" class="btn btn-link btn-lg py-0 text-dark js-delete-user" data-id='+user.id+'><i class="fa fa-trash-o" aria-hidden="true"></i></button>'+
            '</td>'+
            '</tr>';
        el.append(markup);
    })
}


$('.table').delegate('.js-delete', 'click', function(e){
    e.preventDefault();
    var time = $(this).closest('tr').find('.js-big').attr('data-time');

    var storedArrImages = JSON.parse(localStorage.getItem('savedImages'));
    if (storedArrImages.length > 1){
        storedArrImages.forEach(function(item, i){
            if (time == item.moment){
                storedArrImages.splice(i, 1);
            }
        });
        localStorage.setItem('savedImages', JSON.stringify(storedArrImages));
        renderImagesTable( JSON.parse(localStorage.getItem('savedImages')), $('#table-photo tbody') )
    } else {
        localStorage.removeItem('savedImages');
        $('#table-photo tbody').empty();
    }
});








// add user - form submit
$('#profileEdit').submit(function(e) {
    e.preventDefault();
    var form = $(this);
    var savedImages = localStorage.getItem('savedImages');

    var data =  {
        id: new Date().getTime(),
        name: $("#profileName").val(),
        lastName: $("#profileLastName").val(),
        images: savedImages
    }


    if (savedImages){
        $.ajax({
            url: '/add_new_user',
            type: "POST",
            data: {
                id: new Date().getTime(),
                createdAt: new Date(),
                name: $("#profileName").val(),
                lastName: $("#profileLastName").val(),
                images: savedImages
            },
            success: function(response){
                var arrUsers = response.users
                // render users table
                renderUsersTable(arrUsers, $('#table-users tbody') );

                form.find('.js-submit').hide();
                form.find('.notification-no-photo').hide();
                form.find('.notification-submit-success').show();
                function closeModal(){
                    $('#modalAddUser').modal('hide');
                }
                setTimeout(closeModal, 1500);
            }
        });
    } else {
        form.find('.notification-no-photo').show();
    }
})




// ajax - get all users
$.ajax({
    url: '/get_users_data',
    type: "GET",
    success: function(response){
        var arrUsers = response.users
        // render users table
        renderUsersTable(arrUsers, $('#table-users tbody') );
    }
});





// delete user from table
$('#table-users').delegate('.js-delete-user', 'click', function(e){
  e.preventDefault();
  var btn = $(e.currentTarget).closest('button');
  var id = btn.attr('data-id');

  $.ajax({
      url: '/delete_user/'+id,
      type: "DELETE",
      success: function(response){
        var arrUsers = response.users;
        renderUsersTable(arrUsers, $('#table-users tbody') );
      }
  });
})


// patch user info
$('.js-patch').click(function(e) {
    e.preventDefault();
    var btn = $(this);
    var id = $(this).attr('data-id');
    var savedImages = localStorage.getItem('savedImages');

    if (savedImages){
        $.ajax({
            url: '/edit_user/'+id,
            type: "PUT",
            data: {
                id: id,
                createdAt: new Date(),
                name: $("#profileName").val(),
                lastName: $("#profileLastName").val(),
                images: savedImages
            },
            success: function(response){
                var arrUsers = response.users;
                renderUsersTable(arrUsers, $('#table-users tbody') );

                btn.closest('form').find('.js-patch').hide();
                btn.closest('form').find('.notification-no-photo').hide();
                btn.closest('form').find('.notification-patch-success').show();
                function closeModal(){
                    $('#modalAddUser').modal('hide');
                }
                setTimeout(closeModal, 1500);
            }
        });
    } else {
        btn.closest('form').find('.notification-no-photo').show();
    }
})



