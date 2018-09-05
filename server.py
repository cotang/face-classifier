#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import shutil
import zipfile
from flask import Flask, request, redirect, url_for, flash, render_template, Response, session, g, jsonify
from werkzeug.utils import secure_filename
#import utils.load_data as load_data
import time
from datetime import datetime, date
import json
import base64
import uuid
import io
import time

UPLOAD_FOLDER = './tmp'
STATIC_FOLDER = './static/local_images'
DATA_FOLDER = 'data'
ALLOWED_EXTENSIONS = set(['zip','jpeg', 'jpg', 'png' ])
ZIP_EXT = set(['zip'])
IMG_EXT = set(['jpeg', 'jpg', 'png'])
status = ''
app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.secret_key = os.urandom(24)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    if '.' in filename and filename.rsplit('.', 1)[1].lower() in ZIP_EXT:
        return 'archive'
    elif '.' in filename and filename.rsplit('.', 1)[1].lower() in IMG_EXT:
        return 'img'
    else:
        return None

# No caching at all for API endpoints.
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must- \
    revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.route('/delete_user/<id>', methods=['DELETE'])
def delete_user(id):
    if request.method == 'DELETE':
        if os.path.isfile('data.json'):
            users = []
            with open('data.json', 'r') as f:
                users = json.load(f)
                idx_2_delete = -1
                for idx, user in enumerate(users['users']):
                    if user['id'] == id:
                        idx_2_delete = idx
                if idx_2_delete >= 0:
                    del users['users'][idx_2_delete]
                #TODO add delete dirs and files
            with open('data.json', 'w') as f:
                json.dump(users, f)
                return jsonify(users)

@app.route('/edit_user/<id>', methods=['PUT'])
def edit_user(id):
    if request.method == 'PUT':
        data = request.form
        user_id = id#data.get('id')
        users = []
        with open('data.json', 'r') as f:
            users = json.load(f)
            for user in users['users']:
                if user['id'] == id:
                    user['createdAt'] = data.get('createdAt')
                    user['name'] = data.get('name')
                    user['lastName'] = data.get('lastName')
                    user['images'] = json.loads(data.get('images'))
        with open('data.json', 'w') as f:
            json.dump(users, f)
        return jsonify(users)

@app.route('/get_users_data', methods=['GET'])
def get_users_data():
    if request.method == 'GET':
        if os.path.isfile('data.json'):
            with open('data.json', 'r') as f:
                users = json.load(f)
                return jsonify(users)
        else:
            return jsonify({'users':[]})

@app.route('/add_new_user', methods=['GET','POST'])
def add_new_user():
    if request.method == 'POST':
        data = request.form
        user_id = data.get('id')
        created_at = data.get('createdAt')
        user_name = data.get('name')
        user_last_name = data.get('lastName')
        images = json.loads(data.get('images'))
        image_data = []
        for img_data in images:
            moment = img_data['moment']
            img_str = img_data['image']
            img_id = img_data['id']
            img_data = base64.b64decode(img_str)
            filename = '{}.png'.format(img_id)
            dir_path = os.path.join(STATIC_FOLDER, user_id)
            image_data.append({'id':img_id, 'moment':moment, 'image':os.path.join(dir_path, filename)})
            if not os.path.exists(dir_path):
                os.makedirs(dir_path)
            with open(os.path.join(dir_path, filename), 'wb') as f:
                f.write(img_data)

        users = {'users':[]}
        if os.path.isfile('data.json'):
            with open('data.json', 'r') as f:
                users = json.load(f)

        users['users'].append({'id':user_id, 'createdAt':created_at, 'name':user_name, 'lastName': user_last_name, \
                              'images': image_data})
        with open('data.json', 'w') as f:
            json.dump(users, f)
    return jsonify(users)

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        session.pop('user',None)
        if request.form['username'] != '1' or request.form['password'] != '1':
            error = 'Invalid username or password. Please try again'
        else:
            session['user'] = request.form['username']
            return redirect(url_for('render_index'))
    return render_template('login.html', error = error)

@app.before_request
def before_request():
    """Initialise session"""
    g.user = None
    if 'user' in session:
        g.user = session['user']

@app.route('/', methods=['GET'])
def render_index():
    if g.user:
        global status
        #result = load_data.load_all_from_db()
        result = [(datetime(2018, 8, 23, 0, 56, 30, 424833), '-1', 'unknown person')]
        return render_template('index.html', status=status, result=result)
    return redirect(url_for('login'))

@app.route('/uploader', methods=['GET','POST'])
def uploader_file():
    try:
        global status
        if request.method == 'POST':
            if 'file' not in request.files:
                flash('No file part')
                return redirect(request.url)
            file = request.files['file']
            if file.filename == '':
                flash('No selected file')
                return redirect(request.url)
            if file and allowed_file(file.filename):
                if get_file_type(file.filename)=='archive':
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    if os.path.isdir(os.path.join(DATA_FOLDER, 'train')):
                        shutil.rmtree(os.path.join(DATA_FOLDER, 'train'))
                    zip_ref = zipfile.ZipFile(os.path.join(UPLOAD_FOLDER, filename), 'r')
                    zip_ref.extractall(os.path.join(DATA_FOLDER, 'train'))
                    zip_ref.close()
                    #status = load_data.train_web()
                    status = 'success'
                elif get_file_type(file.filename)=='img':
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    status = 'success'
                    # status = load_data.recognize_web(os.path.join(UPLOAD_FOLDER, filename))
            else:
                status = 'file must be with jpeg, jpg, png or zip extensions'
    except Exception as e:
        status = 'choose a file please'
        print (str(e))
    return redirect(url_for('render_index'))



if __name__ == "__main__":
    app.run(debug=False, port=5000, host='127.0.0.1', threaded=False)
    # app.run(debug=False, port=5000, host='10.36.1.81', threaded=False)

