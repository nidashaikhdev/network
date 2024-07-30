document.addEventListener('DOMContentLoaded',  function() {
    // Add event listeners
    document.querySelector('#all-posts').addEventListener('click', allpost);
    document.querySelector('#following').addEventListener('click', fposts);

    document.querySelector('#submit-post').addEventListener('click', crp);


    allpost();
});

//fetch the current username
function getuser() {
    return document.querySelector('#use').textContent;
}

//disaply all the posts
function allpost(page = 1) {
    document.querySelector('#newp').style.display = 'block';

    document.querySelector('#profv').style.display = 'none';
    document.querySelector('#postv').style.display = 'block';
    document.querySelector('#post-content').value = "";

    fetch(`/all_posts?page=${page}`)
        .then(response => response.json())
        .then(network => {
            dispost(network.posts);
            pagi(network.page_number, network.has_next, network.has_previous);
        });
}
//function for pagination

function pagi(pnum, next, prev) {
    const pagiele = document.querySelector('#pagination');
    pagiele.innerHTML = "";

    if (prev) {
        const prevb = document.createElement('button');
        prevb.classList.add('btn', 'btn-outline-secondary')
        prevb.textContent = 'Previous';
        prevb.addEventListener('click', () => {
            allpost(parseInt(pnum) - 1);
        });
        pagiele.appendChild(prevb);
    }

    if (next) {
        const nextb = document.createElement('button');
        nextb.classList.add('btn', 'btn-secondary');
        nextb.textContent = 'Next';
        nextb.addEventListener('click', () => {
            allpost(parseInt(pnum) + 1);
        });
        pagiele.appendChild(nextb);
    }
}

//display the following the posts

function fposts(page) {
    document.querySelector('#newp').style.display = 'none';

    document.querySelector('#profv').style.display = 'none';
    document.querySelector('#postv').style.display = 'block';
    fetch(`/following?page=${page}`)
        .then(response => response.json())
        .then(network => {
            dispost(network.posts);
            pagi(network.pagination.page_number, network.has_next, network.pagination.has_previous);
        });
}



//Create the posts
function crp() {

    const content = document.querySelector('#post-content').value;
    fetch('/new_post', {
        method: 'POST',
        body: JSON.stringify({ content: content })

    })
        .then(response => {

            allpost();
        });
}

//Display the posts
function dispost(posts) {

    const postcon = document.querySelector('#postv');
    postcon.innerHTML = '';
    posts.forEach(post => {
        let c = post.liked ? 'Unlike' : 'Like';
        let ia= (post.user === (document.querySelector('#use').textContent));
        let h =  ia ? ''  : 'disabled';

       const pse = document.createElement('div');
        pse.className = 'card mb-2';
        pse.innerHTML = `
            <div class="card-body">
            <div id = "ref">
                <p class="card-text">${post.content}</p>
                </div>
                <small class="text-muted" onclick ="show('${post.user}')" >Posted by <c style = "font-size:large;
    font-family: serif;
    color: #6112af;" > ${post.user} </c> on ${post.timestamp}</small>

    <p>
                <span class="post-likes" id="likes-count-${post.id}">Likes: ${post.likes_count}</span>
             <p>   <button id="like-button" data-post-id="${post.id}" class="btn" style = "background-color: #ff30bbcc; color: white">
     ${c}
</button>
    <button ${h} data-edit-id="${post.id}" id="edit" class="btn btn-primary">
    Edit
</button></p>
</p>
<p style= "font-family: serif;
    color: #6112af;" onclick ="show('${post.user}')">  Follow click here:<c style= "font-family: serif;
    -webkit-text-decorations-in-effect: blink;
    text-decoration-line: underline;
    font-style: oblique;
    font-size : xx-large;
    color: #6112af;" >  ${post.user}</c> </p>
            </div>
        `;
        postcon.appendChild(pse);
    });


//Like the post
    document.querySelectorAll('#like-button').forEach(button => {
        button.onclick = function() {
            const postId = this.dataset.postId;
            fetch(`/like_post/${postId}`, {
                method: 'PUT'
            })
                .then(response => response.json())
                .then(network => {
                    if (network.error) {
                        alert(network.error);
                    } else {
                        this.textContent = network.liked ? 'Unlike' : 'Like';
                        document.querySelector(`#likes-count-${postId}`).textContent = `Likes: ${network.likes_count}`;
                    }
                })
                .catch(error => console.error('Error:', error));
        };
    });

//Edit the posts on clicking
    document.querySelectorAll('#edit').forEach(button => {
        button.addEventListener('click', function() {
            const postId = this.dataset.editId;
            const pse = this.closest('.card-body');
            const p = pse.querySelector('#ref');
            const postContent = pse.querySelector('.card-text').textContent;


            p.innerHTML = `
            <textarea class="form-control" id="edit-textarea-${postId}">${postContent}</textarea>
            <p></p>
            <button class="btn btn-primary" id="save-button-${postId}">Save</button>
          `;


            document.getElementById(`save-button-${postId}`).addEventListener('click', () => {
                const edited = document.getElementById(`edit-textarea-${postId}`).value;
                fetch(`/edit_post/${postId}`, {
                    method: 'PUT',

                    body: JSON.stringify({ content: edited }),
                })
                    .then(response => response.json())
                    .then(network => {
                        if (network.message) {

                            p.innerHTML = `
        <p class="card-text">${edited}</p>

      `;

                        } else {
                            alert(network.error);
                        }
                    }).catch(error => alert('Error:', error));


            }).catch(error => alert('Error:', error));
        })

    });

    }

    //Show the user profile
    function show(username) {

        document.querySelector('#newp').style.display = 'none';

    document.querySelector('#profv').style.display = 'block';
    document.querySelector('#postv').style.display = 'block';

        fetch(`/profile/${username}`)
            .then(response => response.json())
            .then(network => {

                const profcon = document.querySelector('#profv');
                profcon.innerHTML = `
                <center>
                    <h3 style = "color: white;">${network.profile.username}'s profile</h3>
<div class="profile-info">
   <h3> <span class="badge badge-primary">Followers: ${network.profile.wersco}</span>
    <span class="badge badge-secondary">Following: ${network.profile.wingco}</span></h3>
    <p></p>
    ${network.profile.isfollow
        ? '<button class="btn btn-warning follow-button" onclick="togg(\'' + network.profile.username + '\')">Unfollow</button>'
        : '<button class="btn btn-success follow-button" onclick="togg(\'' + network.profile.username + '\')">Follow</button>'
    }
</div>
<p></p>  <h3 style = "color: white;">${network.profile.username}'s Posts</h3> </center>
                `;


                dispost(network.posts);
                pagi(network.pagination.page_number, network.pagination.has_next, network.pagination.has_previous);
            });
    }

    //Togglefollow
    function togg(username) {

        fetch(`/follow/${username}`, {
            method: 'POST',

        })
        .then(response => response.json())
        .then(network => {
            if (network.error) {
              alert(network.error);
            } else {
              show(username);
            }
        })

    }


