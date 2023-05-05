from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from . import views
urlpatterns = [
                             # ex: /simulate/
    path('', views.index, name='index'),
                             # ex : /simulate/input/
    path('SimulationInput/', views.SimulationInput, name='SimulationInput'),
                             # ex : /simulate/results/
    path('SimulationResult/', views.SimulationResult, name='SimulationResult'),
                             # ex : /simulate/simulating/
    path('simulating/', views.SimulationResult, name='simulating'),
                             # ex : /simulate/credit/
    path('credit/', views.credit, name='credit'),
                             # ex : /simulate/JSONFileViewer/
    path('JSONFileViewer/', views.JSONFileViewer, name='JSONFileViewer'),
                             # ex : /simulate/Error/
    path('Error/', views.Error, name='Error'),
                             # ex : /simulate/help/
    path('help/', views.help, name='help'),
                                 # ex : /simulate/WaitingQueue/
    path('WaitingQueue/', views.WaitingQueue, name='WaitingQueue')
]
urlpatterns += staticfiles_urlpatterns()