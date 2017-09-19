#!/bin/bash

pwd

TARGET=/home/server10g/huunghia/mmt-operator
USER=server10g
PORT=22
IP=192.168.0.7

#USER=montimage
#IP=192.168.0.194

#TARGET=/home/server10gb/huunghia/mmt-operator
#USER=root
#IP=192.168.0.35

#TARGET=/home/mmt/mmt-operator
#USER=mmt
#IP=localhost
#PORT=2222


#TARGET=/home/montimage/mmt-operator
#USER=montimage
#IP=localhost
#PORT=2233

#rsync -e "ssh -i /Users/nhnghia/.ssh/id_rsa -p $PORT" -rca ./* .git $USER@$IP:$TARGET

#TARGET=/home/server10ga/huunghia/mmt-operator/
#USER=root
#IP=192.168.0.36
#PORT=22

rsync -av --progress -e "ssh -i /Users/nhnghia/.ssh/id_rsa -p $PORT"  --exclude /www/public/db_backup  --exclude /www/dist  --exclude /.git -rca ./ $USER@$IP:$TARGET