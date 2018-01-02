eval $(docker-machine env $DM)
docker logs -f $CID
sleep 1