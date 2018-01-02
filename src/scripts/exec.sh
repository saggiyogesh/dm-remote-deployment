eval $(docker-machine env $DM)
docker exec -it $CID /bin/sh
t1=$?
echo exec exit code:: "$t1"
sleep 1