<?php

namespace fadosProduccions\fullCalendarBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\Common\Persistence\ManagerRegistry;
use fadosProduccions\fullCalendarBundle\Model\CalendarManagerEntity as baseCalendarManager;
use Symfony\Component\Validator\Constraints\DateTime;
use AppBundle\Entity\CompanyEvents;

class CalendarController extends Controller
{
    private $manager;

    function loadAction(Request $request) {

        //Get start date
        $createdAt = $request->get('start');
        $endAt = $request->get('end');
        $GroupId = $request->get('gruppeId');
        $dataFrom = new \DateTime($createdAt);
        $dataTo = new \DateTime($endAt);
        $em=$this->getDoctrine()->getManager();
        $GroupEntity=$em->getRepository("AppBundle:SchuleGroup")->find($GroupId);


        //Get entityManager
        $manager = $this->get('fados.calendar.service');
        $events = $manager->getEvents($dataFrom,$dataTo,$GroupEntity);

        $status = empty($events) ? Response::HTTP_NO_CONTENT : Response::HTTP_OK;
        $jsonContent = $manager->serialize($events);

        $response = new Response();
        $response->headers->set('Content-Type', 'application/json');
        $response->setContent($jsonContent);
        $response->setStatusCode($status);
        return $response;
    }

    function changeAction(Request $request) {

        $id = $request->get('id');
        $newStartData = $request->get('newStartData');
        $newEndData = $request->get('newEndData');
        $event_date=$request->get('event_date');
        $this->get('fados.calendar.service')->changeDate($newStartData,$newEndData,$id,$event_date);
        return new Response($id, 201);

    }

    /*
     * Change end date event
     *
     */
    function resizeAction(Request $request) {

        $id = $request->get('id');
        $startDate = $request->get('newStartData');
        $endDate = $request->get('newEndData');
        $this->get('fados.calendar.service')->resizeEvent($startDate,$endDate,$id);

        return new Response($id, 201);

    }
    function deleteAction(Request $request) {

        $id = $request->get('id');
        $this->get('fados.calendar.service')->deleteEvent($id);
        return new Response($id, 201);

    }
    function addAction(Request $request) {
        $user=$this->getUser();
        $Ort=$user->getStandOrt();
        $eventtype=$request->get('eventtype');
        $startDate = $request->get('start');
        $endDate = $request->get('end');
        $title = $request->get('title');
        $event_date = $request->get('event_date');
        $group = $request->get('group');
        $bgcolor=$this->getbgcolorAction($eventtype);
        $em=$this->getDoctrine()->getManager();
        $EventTypeObj=$em->getRepository("AppBundle:EventType")->find($eventtype);
        $GroupObj=$em->getRepository("AppBundle:SchuleGroup")->find($group);

        if($eventtype==4){ //check if its unterricht event

            $dozent = $request->get('dozent');
            $einzelfach = $request->get('einzehl');
            $DozentObj=$em->getRepository("AppBundle:Dozent")->find($dozent);
            $EinzelfachObj=$em->getRepository("AppBundle:EinzelFach")->find($einzelfach);
            $event=$this->get('fados.calendar.service')->addEvent($startDate,$endDate,$title,$event_date,$GroupObj,$DozentObj,$EinzelfachObj,$EventTypeObj,$bgcolor,$Ort);
            return new Response(json_encode(array('event'=>$event)));

        } // else



        $entity= new CompanyEvents();
        $entity->setTitle($title);
        $entity->setBgColor($bgcolor);
        $entity->setStartDatetime(new \DateTime($startDate));
        $entity->setEndDatetime(new \DateTime($endDate));
        $entity->setAllDay(0);
        $entity->setEventDate($event_date);
        $entity->setSchuleGroup($GroupObj);
        $entity->setEventtype($EventTypeObj);
        $entity->setStandOrt($Ort);
        $diff=$this->get('fados.calendar.service')->DifferencDatetime($startDate,$endDate);
        $entity->setEventHours($diff);
        $em->persist($entity);
        $em->flush();
        $event=$entity->toArray();
        return new Response(json_encode(array('event'=>$event)));


    }
    function checkAction(Request $request){

        if($request->get('eventtype')==4) {

            $startDate = $request->get('startevent');
            $endDate = $request->get('endevent');
            $dozent = $request->get('dozent');
            $eventid = $request->get('id');
            /* get the array of dates between start date and end date for the new event that i want to add */
            $dataFrom = new \DateTime($startDate);
            $dataTo = new \DateTime($endDate);
            $currentdate = $dataFrom->format('Y-m-d');
            $interval = new \DateInterval('PT1H');
            $period = new \DatePeriod($dataFrom, $interval, $dataTo);
            $current_eventrange = array();
            $dozent_event = array();
            foreach ($period as $date) {
                $current_eventrange[] = $date->format('Y-m-d H:i:s');
            }

            /* select all of events in DB in this day for this Dozent*/

            $em = $this->getDoctrine()->getManager();
            $DozentObj = $em->getRepository("AppBundle:Dozent")->find($dozent);
            $repository = $em->getRepository("AppBundle:CompanyEvents");
            $events = $repository->checkEventQuery($DozentObj, $currentdate);


            /* check if the dozent have event in this day */


            if ($events) {
                foreach ($events as $event) {
                    if ($event->getId() != $eventid) {
                        $founded_event_start = $event->getStartDatetime();
                        $founded_event_end = $event->getEndDatetime();
                        $founded_interval = new \DateInterval('PT1H');
                        $founded_period = new \DatePeriod($founded_event_start, $founded_interval, $founded_event_end);
                        foreach ($founded_period as $founded_date) {/*get  the array of dates between start date and end date for each event that related to this dozent */
                            $dozent_event[] = $founded_date->format('Y-m-d H:i:s');
                        }
                    }


                }
                $intersect_event = array_intersect($current_eventrange, $dozent_event); /* check the conflict */
                if (count($intersect_event) > 0) {
                    $response = new Response();
                    $response->setContent($DozentObj->getDozentName() . ' hat Unterricht in diesem Zeit bei anderem Group');
                    $response->setStatusCode(400);
                    return $response;
                }

            }

        }
        return new Response(json_encode(array('event' => 'Dozent is available')));




    }

    function geteventdozentAction(Request $request){

        $id = $request->get('id');
        $em=$this->getDoctrine()->getManager();
        $event=$em->getRepository("AppBundle:CompanyEvents")->find($id);
        $dozentObj=$event->getDozent();
        $eventtype=$event->getEventtype();
        $eventtypeid=$eventtype->getId();
        if ($eventtypeid!=4){

            return new Response(json_encode(array('id'=>null,'eventtypeid'=>$eventtypeid)));

        }

        $did=$dozentObj->getId();

        $eventtypeid=$eventtype->getId();
        return new Response(json_encode(array('id'=>$did,'eventtypeid'=>$eventtypeid)));





    }

    function getbgcolorAction($type){

        $Bgcolor=array('1'=>'#d58512','2'=>'#4cae4c','3'=>'#d9534f','4'=>'#337ab7');
        return $Bgcolor[$type];
    }

}