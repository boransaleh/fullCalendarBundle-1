<?php

/**
 * Created by PhpStorm.
 * User: Albert
 * Date: 23/2/2016
 * Time: 8:52
 */
namespace fadosProduccions\fullCalendarBundle\Services;

use AppBundle\Entity\SchuleGroup;
use Doctrine\Common\Persistence\ManagerRegistry;
use Symfony\Component\DependencyInjection\ContainerInterface as Container;
use Doctrine\ORM\EntityManager;
use AppBundle\Entity\CompanyEvents;
use Symfony\Component\Validator\Constraints\DateTime;


class CalendarManagerRegistry
{
    protected $managerRegistry;
    protected $container;
    protected $recipient;
    protected $manager;

    public function __construct(ManagerRegistry $managerRegistry, Container $container)
    {
        $this->container = $container;
        $this->recipient = $this->container->getParameter( 'class_manager' );
        $this->managerRegistry = $managerRegistry;
        $this->manager = $this->managerRegistry->getManagerForClass($this->recipient);

    }

    public function getManager() {
        return $this->manager;
    }

    public function getEvents($dataFrom,$dataTo,SchuleGroup $GroupEntity) {
        $qb = $this->manager->createQueryBuilder()
            ->select('c')
            ->from($this->recipient, 'c')
            ->where('c.startDatetime BETWEEN :firstDate AND :lastDate')
            ->andWhere('c.SchuleGroup =:schuleGroup')
            ->setParameter('firstDate', $dataFrom)
            ->setParameter('lastDate', $dataTo)
            ->setParameter('schuleGroup', $GroupEntity)
        ;



        return $qb->getQuery()->getResult();

    }

    public function changeDate($newStartData,$newEndData,$id,$event_date) {
        $entity = $this->manager->getRepository($this->recipient)->find($id);

        $entity->setStartDatetime(new \DateTime($newStartData));
        $entity->setEndDatetime(new \DateTime($newEndData));
        $entity->setEventDate($event_date);
        $diff=$this->DifferencDatetime($newStartData,$newEndData);
        $entity->setEventHours($diff);
        $this->save($entity);


   }

    public function resizeEvent($newStartDate,$newEndDate,$id) {
        $entity = $this->manager->getRepository($this->recipient)->find($id);
        $entity->setEndDatetime(new \DateTime($newEndDate));
        $diff=$this->DifferencDatetime($newStartDate,$newEndDate);
        $entity->setEventHours($diff);
        $this->save($entity);
   }

    public function serialize($elements) {
        $result = [];
        foreach ($elements as $element) {
            $result[] = $element->toArray();
        }
        return json_encode($result);
    }
    public function deleteEvent($id) {
        $entity = $this->manager->getRepository($this->recipient)->find($id);
        $this->delete($entity);
    }

    public function save($entity) {
        $this->manager->persist($entity);
        $this->manager->flush();
    }
    public function delete($entity) {
        $this->manager->remove($entity);
        $this->manager->flush();
    }

    public function addEvent($newStartData,$newEndData,$title,$event_date, $group, $dozent,$einzelfach ,$eventtype,$bgcolor,$ort) {
        $entity= new CompanyEvents();
        $entity->setTitle($title);
        $entity->setStartDatetime(new \DateTime($newStartData));
        $entity->setEndDatetime(new \DateTime($newEndData));
        $entity->setEventHours($this->DifferencDatetime($newStartData,$newEndData));
        $entity->setAllDay(0);
        $entity->setEventDate($event_date);
        $entity->setDozent($dozent);
        $entity->setSchuleGroup($group);
        $entity->setEinzelFach($einzelfach);
        $entity->setEventtype($eventtype);
        $entity->setBgColor($bgcolor);
        $entity->setStandOrt($ort);
        $this->save($entity);
        $event=$entity->toArray();
        return $event;

    }

    public function DifferencDatetime($date1,$date2){

        //calculate the hours of this event
        $startDate=new \DateTime($date1);
        $endDate=new \DateTime($date2);
        $diffrence=$startDate->diff($endDate)->format('%h');
        //end of calculatr the hours
        return $diffrence;
    }



}