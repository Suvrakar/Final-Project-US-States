# Final-Project-US-States

<h1>GET</h1>
Request: Response:
/states/ All state data returned
/states/?contig=true All state data for contiguous states (Not AK or HI)
/states/?contig=false All state data for non-contiguous states (AK, HI)
/states/:state All data for the state URL parameter
/states/:state/funfact A random fun fact for the state URL parameter
/states/:state/capital { ‘state’: stateName, ‘capital’: capitalName }
/states/:state/nickname { ‘state’: stateName, ‘nickname’: nickname }
/states/:state/population { ‘state’: stateName, ‘population’: population }
/states/:state/admission { ‘state’: stateName, ‘admitted’: admissionDate }


<h1>POST</h1>
Request: Response
/states/:state/funfact


<h1>PATCH</h1>
Request: Response
/states/:state/funfact 
